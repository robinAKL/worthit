import { createHash } from 'node:crypto';

/**
 * Whitelists. Whatever an adapter returns, only these keys leave the collector.
 * Images, descriptions, reviews and seller details are never on the list.
 */
export const PRODUCT_FACTS = ['id', 'title', 'category', 'price', 'currency', 'merchant', 'url', 'imageCount', 'condition', 'capturedAt', 'specs'];
const DROPPED_SPEC = new Set(['description', 'review', 'reviews', 'image', 'imageurl', 'images']);

export const VEHICLE_FACTS = [
  'id',
  'dealer',
  'url',
  'capturedAt',
  'make',
  'model',
  'generation',
  'variant',
  'year',
  'odometerKm',
  'priceNzd',
  'orcIncluded',
  'fuel',
  'transmission',
  'body',
  'engineCc',
  'nzNew',
  'wofExpiry',
  'regoExpiry',
  'region',
  'dedupeKey',
];

export function keepProductFacts(row) {
  const kept = {};
  for (const key of PRODUCT_FACTS) {
    if (row[key] !== undefined) kept[key] = row[key];
  }
  if (kept.specs && typeof kept.specs === 'object') {
    const specs = {};
    for (const [key, value] of Object.entries(kept.specs)) {
      if (DROPPED_SPEC.has(key.toLowerCase())) continue;
      specs[key] = value;
    }
    kept.specs = specs;
  }
  return kept;
}

/**
 * `imageUrl` is kept only when the adapter declares written permission for this dealer.
 * A raw VIN or plate never leaves; it becomes a one-way `dedupeKey`.
 */
export function keepVehicleFacts(row, { imagePermission = false } = {}) {
  const kept = {};
  for (const key of VEHICLE_FACTS) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') kept[key] = row[key];
  }
  if (!kept.dedupeKey && (row.vin || row.plate)) kept.dedupeKey = dedupeKey(row.vin || row.plate);
  if (imagePermission && typeof row.imageUrl === 'string' && row.imageUrl.startsWith('https://')) {
    kept.imageUrl = row.imageUrl;
  }
  kept.source = 'feed';
  return kept;
}

export function dedupeKey(identifier) {
  const normal = String(identifier).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `v-${createHash('sha256').update(normal).digest('hex').slice(0, 16)}`;
}

/** Problems that make a vehicle row unusable. Empty array means it can be saved. */
export function vehicleProblems(row) {
  const problems = [];
  if (!row.make) problems.push('make');
  if (!row.model) problems.push('model');
  if (!Number.isInteger(row.year) || row.year < 1950 || row.year > new Date().getFullYear() + 1) problems.push('year');
  if (!(row.priceNzd > 0)) problems.push('priceNzd');
  if (!String(row.url ?? '').startsWith('https://')) problems.push('url');
  if (row.odometerKm !== undefined && !(row.odometerKm >= 0 && row.odometerKm < 2_000_000)) problems.push('odometerKm');
  return problems;
}
