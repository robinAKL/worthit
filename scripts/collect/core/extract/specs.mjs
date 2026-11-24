/**
 * Helpers for dealer pages that show facts in a label/value table instead of JSON-LD.
 * They read text only; nothing here fetches.
 */

const ENTITIES = { '&amp;': '&', '&nbsp;': ' ', '&#036;': '$', '&#36;': '$', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };

export function textOf(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Label to value map from common markup:
 * <th>L</th><td>V</td>, <dt>L</dt><dd>V</dd>, and the Motorcentral
 * `<div class="... title ...">L</div><div class="... columns ...">V</div>` rows.
 * Labels are lowercased and stripped of a trailing colon. The first value wins.
 */
export function labelledValues(html) {
  const out = new Map();
  const add = (label, value) => {
    const key = textOf(label).toLowerCase().replace(/[:\s]+$/, '');
    const val = textOf(value);
    if (key && val && !out.has(key)) out.set(key, val);
  };
  const source = String(html ?? '');
  for (const m of source.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) add(m[1], m[2]);
  for (const m of source.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) add(m[1], m[2]);
  for (const m of source.matchAll(/<div class="[^"]*\btitle\b[^"]*">([^<]{1,40})<\/div>\s*<div class="[^"]*\bcolumns\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)) add(m[1], m[2]);
  // WordPress dealer themes: <span class="about-label">Odometer</span> <span class="about-title">71,700kms</span>
  for (const m of source.matchAll(/<span class="[^"]*\blabel\b[^"]*">([^<]{1,40})<\/span>\s*<span class="[^"]*\b(?:title|value)\b[^"]*">([^<]{0,80})<\/span>/gi)) add(m[1], m[2]);
  return out;
}

export function pick(values, ...labels) {
  for (const label of labels) {
    const v = values.get(label.toLowerCase());
    if (v && v !== '-') return v;
  }
  return undefined;
}

/** "$14,995" -> 14995. Returns undefined for "POA", ranges, or weekly prices. */
export function priceOf(text) {
  const s = String(text ?? '');
  if (/poa|per week|\/wk|from\s/i.test(s)) return undefined;
  const m = s.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ''));
  return n >= 500 && n < 5_000_000 ? Math.round(n) : undefined;
}

/** "19,798km", "27,476kms", "42 000 km" -> number. */
export function kmOf(text) {
  const m = String(text ?? '').match(/([\d][\d,\s]*)\s*(km|kms|kilomet)/i);
  if (!m) return undefined;
  const n = Number(m[1].replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** "996cc", "1.5L", "1500 cc" -> cc. "60kW" (electric output) -> undefined. */
export function ccOf(text) {
  const s = String(text ?? '');
  const cc = s.match(/(\d{3,5})\s*cc/i);
  if (cc) return Number(cc[1]);
  const litre = s.match(/\b(\d\.\d)\s*l(itre)?\b/i);
  if (litre) return Math.round(Number(litre[1]) * 1000);
  return undefined;
}

export function fuelOf(value) {
  const v = String(value ?? '').toLowerCase();
  if (!v.trim()) return undefined;
  if (/plug/.test(v)) return 'plug-in-hybrid';
  if (/hybrid/.test(v)) return 'hybrid';
  if (/electric|\bev\b/.test(v)) return 'electric';
  if (/diesel/.test(v)) return 'diesel';
  if (/petrol|gasoline|unleaded/.test(v)) return 'petrol';
  if (/lpg/.test(v)) return 'lpg';
  return 'other';
}

export function transmissionOf(value) {
  const v = String(value ?? '').toLowerCase();
  if (!v.trim()) return undefined;
  if (/cvt/.test(v)) return 'cvt';
  if (/auto|tiptronic|dct|dsg/.test(v)) return 'automatic';
  if (/manual/.test(v)) return 'manual';
  return 'other';
}

/** "5 Door, Hatchback" -> "hatchback". */
export function bodyOf(value) {
  const v = String(value ?? '').toLowerCase();
  const known = ['hatchback', 'sedan', 'wagon', 'station wagon', 'suv', 'ute', 'van', 'coupe', 'convertible', 'cab chassis', 'people mover', 'minivan'];
  const hit = known.find((k) => v.includes(k));
  if (hit) return hit === 'station wagon' ? 'wagon' : hit;
  const last = v.split(',').pop()?.trim();
  return last || undefined;
}

const TWO_WORD_MAKES = ['land rover', 'alfa romeo', 'aston martin', 'great wall', 'rolls royce'];

/** "2017 Toyota Vitz F" -> { year: 2017, make: 'Toyota', model: 'Vitz', variant: 'F' }. */
export function splitTitle(title) {
  const words = textOf(title).split(' ').filter(Boolean);
  const out = {};
  if (/^(19[5-9]\d|20\d\d)$/.test(words[0] ?? '')) out.year = Number(words.shift());
  if (words.length === 0) return out;
  const two = `${words[0]} ${words[1] ?? ''}`.toLowerCase();
  out.make = TWO_WORD_MAKES.includes(two) ? words.splice(0, 2).join(' ') : words.shift();
  if (words.length > 0) out.model = words.shift();
  if (words.length > 0) out.variant = words.join(' ');
  return out;
}

/** Title-case an all-caps model word from a listing ("AQUA" -> "Aqua"), leave mixed case alone. */
export function tidyName(value) {
  const s = String(value ?? '').trim();
  if (!s) return s;
  return s === s.toUpperCase() && /[A-Z]{3,}/.test(s) && !/\d/.test(s) ? s[0] + s.slice(1).toLowerCase() : s;
}

const PLACE_TO_REGION = {
  auckland: 'Auckland',
  hamilton: 'Waikato',
  tauranga: 'Bay of Plenty',
  rotorua: 'Bay of Plenty',
  napier: "Hawke's Bay",
  hastings: "Hawke's Bay",
  'new plymouth': 'Taranaki',
  'palmerston north': 'Manawatū-Whanganui',
  whanganui: 'Manawatū-Whanganui',
  wellington: 'Wellington',
  'lower hutt': 'Wellington',
  'upper hutt': 'Wellington',
  porirua: 'Wellington',
  nelson: 'Nelson',
  blenheim: 'Marlborough',
  christchurch: 'Canterbury',
  timaru: 'Canterbury',
  dunedin: 'Otago',
  queenstown: 'Otago',
  invercargill: 'Southland',
};

/** Town or suburb text to NZ region, only for towns listed above. */
export function regionOf(place) {
  const v = String(place ?? '').toLowerCase();
  for (const [town, region] of Object.entries(PLACE_TO_REGION)) if (v.includes(town)) return region;
  return undefined;
}
