/**
 * Build src/data/rent-sa2.json from the local quarterly bond CSV and the
 * Stats NZ SA2 2019 concordance. Both inputs live in scripts/cache and are
 * not committed. This script never averages quartiles across areas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quarterlyPath = resolve(root, 'scripts/cache/quarterly.csv');
const concordancePath = resolve(root, 'scripts/cache/sa2-2019.csv');
const bondsPath = resolve(root, 'src/data/rent-bonds.json');
const outPath = resolve(root, 'src/data/rent-sa2.json');

const DWELLING_ORDER = ['ALL', 'House', 'Flat', 'Apartment', 'Room', 'Boarding House'];
const BED_ORDER = ['ALL', '1', '2', '3', '4', '5', '5+', '6', 'NA'];

const quarterly = parseCsv(readFileSync(quarterlyPath, 'utf8'));
const concordance = parseCsv(readFileSync(concordancePath, 'utf8'));
const bonds = JSON.parse(readFileSync(bondsPath, 'utf8'));
const bondNames = new Set(bonds.areas.map((area) => area.name));

const qHeader = quarterly[0].map((cell) => cell.trim());
const qIndex = Object.fromEntries(qHeader.map((name, column) => [name, column]));
for (const name of [
  'TimeFrame',
  'Location Id',
  'Dwelling Type',
  'Number Of Beds',
  'Total Bonds',
  'Median Rent',
  'Upper Quartile Rent',
  'Lower Quartile Rent',
]) {
  if (qIndex[name] === undefined) throw new Error(`Missing quarterly column ${name}`);
}

const cHeader = concordance[0].map((cell) => cell.trim());
const cIndex = Object.fromEntries(cHeader.map((name, column) => [name, column]));
for (const name of ['SA22019_V1_00', 'SA22019_V1_00_NAME', 'TA2019_V1_00_NAME']) {
  if (cIndex[name] === undefined) throw new Error(`Missing concordance column ${name}`);
}

const places = new Map();
for (const cells of concordance.slice(1)) {
  const code = cells[cIndex.SA22019_V1_00].trim();
  const name = cells[cIndex.SA22019_V1_00_NAME].trim();
  const ta = cells[cIndex.TA2019_V1_00_NAME].trim();
  if (!code || !name || !ta) throw new Error(`Incomplete concordance row ${code}`);
  if (places.has(code)) throw new Error(`Duplicate SA2 code ${code}`);
  places.set(code, { code, name, ta });
}

let latestValue = -1;
let latestFrame = '';
for (const cells of quarterly.slice(1)) {
  const frame = cells[qIndex.TimeFrame].trim();
  const value = frameValue(frame);
  if (value > latestValue) {
    latestValue = value;
    latestFrame = frame;
  }
}

const dwellings = new Set();
const beds = new Set();
const byCode = new Map();
const missingCodes = new Set();
let published = 0;
let suppressed = 0;

for (const cells of quarterly.slice(1)) {
  if (cells[qIndex.TimeFrame].trim() !== latestFrame) continue;
  const code = cells[qIndex['Location Id']].trim();
  if (!code || code === 'NULL' || code === '-99') continue;
  const place = places.get(code);
  if (!place) {
    missingCodes.add(code);
    continue;
  }
  const dwelling = cells[qIndex['Dwelling Type']].trim();
  const bed = cells[qIndex['Number Of Beds']].trim();
  dwellings.add(dwelling);
  beds.add(bed);
  const lower = number(cells[qIndex['Lower Quartile Rent']]);
  const median = number(cells[qIndex['Median Rent']]);
  const upper = number(cells[qIndex['Upper Quartile Rent']]);
  const count = number(cells[qIndex['Total Bonds']]);
  const key = `${dwelling}|${bed}`;
  const bucket = byCode.get(code) ?? {};
  if (bucket[key]) throw new Error(`Duplicate cell ${code} ${key}. Refusing to merge rows.`);
  if (lower === null || median === null || upper === null || count === null || count < 5) {
    suppressed += 1;
    byCode.set(code, bucket);
    continue;
  }
  bucket[key] = [lower, median, upper, count];
  byCode.set(code, bucket);
  published += 1;
}

if (missingCodes.size > 0) {
  throw new Error(`Quarterly location ids missing from the concordance: ${[...missingCodes].slice(0, 12).join(', ')}`);
}

const taNames = new Set([...places.values()].map((place) => place.ta));
const unmatchedTa = [...taNames].filter((name) => !bondNames.has(name)).sort();

const suburbs = [...places.values()]
  .map((place) => ({
    code: place.code,
    name: place.name,
    ta: place.ta,
    cells: sortCells(byCode.get(place.code) ?? {}),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.code.localeCompare(b.code));

const dataset = {
  quarter: isoDate(latestFrame),
  timeFrame: latestFrame,
  pageUrl: 'https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/',
  sourceUrl: 'https://www.tenancy.govt.nz/assets/Uploads/Tenancy/Rental-bond-data/detailed-quarterly-tenancy-q1-2020q3-november-2026.csv',
  licence: 'CC BY 3.0 NZ',
  licenceUrl: 'https://creativecommons.org/licenses/by/3.0/nz/',
  attribution: 'MBIE',
  countField: 'Total Bonds',
  geographyName: 'Statistical Area 2 Higher Geographies 2019 (generalised)',
  geographyLayer: '98779',
  geographyUrl: 'https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/',
  geographyLicence: 'CC BY 4.0',
  geographyLicenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  geographyAttribution: 'Stats NZ',
  downloadedAt: '2026-11-24',
  note: 'Each cell is one published SA2, dwelling type and bedroom row. Quartiles are never averaged across areas. The sample is Total Bonds, the bonds lodged in the quarter. A cell with fewer than 5 lodged bonds, or with suppressed quartiles, is omitted and the lookup reports insufficient data.',
  dwellings: order(dwellings, DWELLING_ORDER),
  beds: order(beds, BED_ORDER),
  suburbs,
};

const limit = 1000 * 1000;
let json = `${JSON.stringify(dataset, null, 2)}\n`;
if (Buffer.byteLength(json) > limit) json = `${JSON.stringify(dataset)}\n`;
if (Buffer.byteLength(json) > limit) {
  throw new Error(`Rent SA2 JSON is ${Buffer.byteLength(json)} bytes, over 1MB. Split by territorial authority before writing.`);
}
writeFileSync(outPath, json);
console.log(`Wrote ${suburbs.length} suburbs, ${published} cells, ${suppressed} suppressed, ${Buffer.byteLength(json)} bytes, quarter ${dataset.quarter}`);
console.log('unmatched TA', unmatchedTa);
const berh = suburbs.find((suburb) => suburb.code === '253300');
const karori = suburbs.find((suburb) => suburb.code === '249400');
console.log('Berhampore House|2', berh?.cells['House|2']);
console.log('Karori Park House|2', karori?.cells['House|2']);

function sortCells(cells) {
  return Object.fromEntries(Object.entries(cells).sort(([a], [b]) => a.localeCompare(b)));
}

function order(values, preferred) {
  return [...values].sort((a, b) => {
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function frameValue(frame) {
  const [day, month, year] = frame.split('/').map(Number);
  if (!day || !month || !year) throw new Error(`Unreadable timeframe ${frame}`);
  return year * 10000 + month * 100 + day;
}

function isoDate(frame) {
  const [day, month, year] = frame.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function number(value) {
  const cleaned = String(value ?? '').replace(/,/g, '').trim();
  if (!cleaned || cleaned.toUpperCase() === 'NULL') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }
  return rows;
}
