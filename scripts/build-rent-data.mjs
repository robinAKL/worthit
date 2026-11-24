/**
 * Rebuild src/data/rent-bonds.json from the latest Tenancy Services
 * territorial-authority monthly CSV linked on the bond data page.
 * The published file has no bedroom column, so every row is bedrooms: "all".
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGE = 'https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'src/data/rent-bonds.json');

const page = await fetch(PAGE, { headers: { 'user-agent': 'WorthIt/0.3 (rent data build)' } });
if (!page.ok) throw new Error(`Bond page returned ${page.status}`);
const html = await page.text();
const hrefs = [...html.matchAll(/href="([^"]+\.csv[^"]*)"/g)].map((match) => match[1]);
const sourceUrl = hrefs.find((href) => /territorial|tla/i.test(href));
if (!sourceUrl) throw new Error('No territorial-authority CSV link on the bond page.');

const csvResponse = await fetch(sourceUrl, { headers: { 'user-agent': 'WorthIt/0.3 (rent data build)' } });
if (!csvResponse.ok) throw new Error(`CSV returned ${csvResponse.status}`);
const csv = await csvResponse.text();
const table = parseCsv(csv);
const header = table[0].map((cell) => cell.trim());
const index = Object.fromEntries(header.map((name, column) => [name, column]));
for (const name of ['Time Frame', 'Location', 'Lodged Bonds', 'Lower Quartile Rent', 'Median Rent', 'Upper Quartile Rent']) {
  if (index[name] === undefined) throw new Error(`Missing column ${name}`);
}

const rows = table.slice(1).map((cells) => ({
  month: cells[index['Time Frame']].slice(0, 7),
  name: cells[index.Location].trim(),
  count: number(cells[index['Lodged Bonds']]),
  lower: number(cells[index['Lower Quartile Rent']]),
  median: number(cells[index['Median Rent']]),
  upper: number(cells[index['Upper Quartile Rent']]),
}));
const month = rows.reduce((latest, row) => (row.month > latest ? row.month : latest), '');
const areas = rows
  .filter((row) => row.month === month && row.name !== 'NA')
  .map((row) => ({
    name: row.name === 'ALL' ? 'New Zealand' : row.name,
    month,
    bedrooms: 'all',
    lower: row.lower,
    median: row.median,
    upper: row.upper,
    count: row.count,
  }))
  .sort((a, b) => (a.name === 'New Zealand' ? -1 : b.name === 'New Zealand' ? 1 : a.name.localeCompare(b.name)));

const dataset = {
  sourceUrl,
  pageUrl: PAGE,
  licence: 'CC BY 3.0 NZ',
  licenceUrl: 'https://creativecommons.org/licenses/by/3.0/nz/',
  attribution: 'MBIE',
  downloadedAt: '2026-11-24',
  month,
  bedroomSplit: false,
  note: 'The territorial-authority monthly file published on this date has no bedroom column. Every row is all bedroom counts.',
  areas,
};
const json = `${JSON.stringify(dataset, null, 2)}\n`;
if (Buffer.byteLength(json) > 300 * 1024) throw new Error('Rent JSON is over 300KB.');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);
console.log(`Wrote ${areas.length} areas for ${month} (${Buffer.byteLength(json)} bytes)`);
console.log(sourceUrl);

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
