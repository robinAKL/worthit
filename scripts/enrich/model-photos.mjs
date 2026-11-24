/**
 * node scripts/enrich/model-photos.mjs [--limit=<n>] [--only="toyota aqua"]
 *
 * Finds one openly licensed photo per car make + model on Wikimedia Commons, downloads a
 * 480 px copy into public/model-photos/, and records author, licence and source in
 * src/data/model-photos.json. Cards show it as an illustrative photo of the model, never as
 * the car for sale. Only CC0, CC BY, CC BY-SA and public-domain files are accepted.
 *
 * Commons API etiquette: identifying User-Agent, one request a second, maxlag.
 * Models already in the manifest (including "none found") are not asked again.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const UA = 'WorthItBot/0.1 (+https://github.com/robinAKL/worthit) model-photo lookup';
const API = 'https://commons.wikimedia.org/w/api.php';

export const ALLOWED_LICENCE = /^(cc0|cc[- ]?by(?:-sa)?(?:[- ]\d(?:\.\d)?)?(?:\s\w+)?|public domain|pd(?:[- ].*)?)$/i;
// Whole words only: "toy" must not match "Toyota".
const NOT_EXTERIOR = /\b(interior|engine|badge|logo|emblem|dashboard|steering|wheels?|rims?|seats?|cockpit|trunk|boot|tail ?lights?|headlights?|grille|detail|key|manual|model car|toy|diecast|lego|infotainment|room)\b/i;
// Not what a buyer sees on a dealer's lot: race and rally cars, concepts, emergency or taxi liveries, wrecks.
// Whole words, so "Grace" and "Vellfire" are not caught by "race" and "fire".
export const NOT_STOCK = /\b(rally|rallye|racing|race ?car|motorsport|livery|circuit|concept|prototype|police|polizei|fire service|ambulance|taxi|crash|wreck|accident)\b/i;

export const slugOf = (key) => key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const words = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
const stripHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Choose the first usable file: open licence, landscape, title names the make and model, exterior shot. */
export function pickImage(pages, make, model) {
  const need = [...words(make), ...words(model)];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const title = String(page.title ?? '').toLowerCase().replace(/[_-]/g, ' ');
    if (!need.every((w) => title.includes(w))) continue;
    if (NOT_EXTERIOR.test(title) || NOT_STOCK.test(title)) continue;
    if (!(info.width > info.height)) continue;
    const meta = info.extmetadata ?? {};
    const licence = stripHtml(meta.LicenseShortName?.value);
    if (!ALLOWED_LICENCE.test(licence)) continue;
    return {
      title: page.title,
      thumb: info.thumburl,
      author: stripHtml(meta.Artist?.value) || 'unknown',
      license: licence,
      licenseUrl: stripHtml(meta.LicenseUrl?.value) || undefined,
      source: info.descriptionurl,
    };
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function politeFetch(url) {
  const wait = 1000 - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(url, { headers: { 'user-agent': UA, 'api-user-agent': UA } });
  if (res.status === 429 || res.status === 403) throw new Error(`stopped: HTTP ${res.status}`);
  return res;
}

async function search(make, model) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    maxlag: '5',
    generator: 'search',
    gsrsearch: `${make} ${model} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '480',
  });
  const res = await politeFetch(`${API}?${params}`);
  const data = await res.json();
  return Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

function carModels() {
  const dir = join(root, 'src', 'data', 'feeds', 'cars');
  const counts = new Map();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    for (const v of JSON.parse(readFileSync(join(dir, f), 'utf8')).vehicles ?? []) {
      const make = v.make === 'Mercedes' ? 'Mercedes-Benz' : v.make;
      const key = `${make} ${v.model}`.trim();
      counts.set(key, { make, model: v.model, n: (counts.get(key)?.n ?? 0) + 1 });
    }
  }
  return [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).toLowerCase();
  const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
  const manifestPath = join(root, 'src', 'data', 'model-photos.json');
  const outDir = join(root, 'public', 'model-photos');
  mkdirSync(outDir, { recursive: true });
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const stats = { asked: 0, found: 0, none: 0, errors: 0 };

  for (const [key, { make, model }] of carModels()) {
    const k = key.toLowerCase();
    if (only && k !== only) continue;
    if (k in manifest) continue;
    if (stats.asked >= limit) break;
    stats.asked += 1;
    try {
      const pick = pickImage(await search(make, model), make, model);
      if (!pick) {
        manifest[k] = null;
        stats.none += 1;
        continue;
      }
      const ext = (pick.thumb.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
      const file = `${slugOf(k)}.${ext}`;
      const img = await politeFetch(pick.thumb);
      if (!img.ok) throw new Error(`image HTTP ${img.status}`);
      writeFileSync(join(outDir, file), Buffer.from(await img.arrayBuffer()));
      manifest[k] = { file: `/model-photos/${file}`, title: pick.title, author: pick.author, license: pick.license, licenseUrl: pick.licenseUrl, source: pick.source };
      stats.found += 1;
      console.error(`ok   ${k} <- ${pick.title} (${pick.license})`);
    } catch (error) {
      stats.errors += 1;
      console.error(`skip ${k}: ${error.message}`);
      if (String(error.message).startsWith('stopped')) break;
    } finally {
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  }
  console.log(JSON.stringify(stats));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
