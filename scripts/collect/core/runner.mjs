import { discover } from './discover.mjs';
import { productsFromHtml, vehiclesFromHtml } from './extract/jsonld.mjs';
import { keepProductFacts, keepVehicleFacts, vehicleProblems } from './facts.mjs';
import { MAX_PRODUCTS_PER_RUN, MIN_INTERVAL_MS, runCap } from './policy.mjs';
import { createSession } from './session.mjs';

export const KINDS = ['product', 'vehicle'];

/** Throws when an adapter is missing a required field or asks for something the core forbids. */
export function checkAdapter(adapter) {
  const problems = [];
  if (!/^[a-z0-9-]+$/.test(adapter?.id ?? '')) problems.push('id must be a lowercase slug');
  if (!adapter?.name) problems.push('name is required');
  try {
    if (new URL(adapter.origin).protocol !== 'https:') problems.push('origin must be https');
  } catch {
    problems.push('origin must be a URL');
  }
  if (!KINDS.includes(adapter?.kind)) problems.push(`kind must be one of ${KINDS.join(', ')}`);
  if (typeof adapter?.enabled !== 'boolean') problems.push('enabled must be true or false');
  if (adapter?.enabled === false && !adapter?.disabledReason) problems.push('a disabled adapter needs disabledReason');
  if (adapter?.extract !== undefined && typeof adapter.extract !== 'function') problems.push('extract must be a function');
  for (const forbidden of ['fetch', 'headers', 'userAgent', 'minIntervalMs', 'concurrency', 'proxy', 'cookies']) {
    if (adapter && forbidden in adapter) problems.push(`${forbidden} is set by the core, not by an adapter`);
  }
  if (problems.length > 0) throw new Error(`adapter ${adapter?.id ?? '?'}: ${problems.join('; ')}`);
  return adapter;
}

/**
 * Run one adapter: robots, discovery, detail pages, extraction, fact whitelist.
 * The adapter supplies URL tests and an `extract(html, ctx)` function; the core does all I/O.
 */
export async function runAdapter({
  adapter,
  limit,
  userAgent,
  fetchImpl,
  minIntervalMs = MIN_INTERVAL_MS,
  maxPerRun = MAX_PRODUCTS_PER_RUN,
  now,
  sleep,
  capturedAt = new Date().toISOString(),
  /** Detail URLs already in the feed, oldest first: new URLs are collected before these are refreshed. */
  known = [],
}) {
  checkAdapter(adapter);
  const session = createSession({ origin: adapter.origin, userAgent, fetchImpl, minIntervalMs, now, sleep });
  const stats = session.stats;
  const result = (rows, extra = {}) => ({ id: adapter.id, kind: adapter.kind, ...stats, saved: rows.length, rows, ...extra });

  if (!adapter.enabled) return result([], { stopped: `disabled: ${adapter.disabledReason}` });
  if (!(await session.loadRobots())) return result([]);

  const cap = runCap(limit, Math.min(maxPerRun, MAX_PRODUCTS_PER_RUN));
  const urls = await discover(adapter, session, cap, { known });
  const extract = adapter.extract ?? defaultExtract(adapter.kind);
  const keep = adapter.kind === 'vehicle'
    ? (row) => keepVehicleFacts(row, { imagePermission: adapter.imagePermission === true })
    : keepProductFacts;

  const rows = [];
  const seen = new Set();
  const rejected = [];
  for (const url of urls) {
    if (rows.length >= cap || session.stopped) break;
    const page = await session.get(url);
    if (session.stopped) break;
    if (!page) continue;
    let found;
    try {
      found = extract(page.body, { url: page.url, name: adapter.name, capturedAt });
    } catch {
      stats.errors += 1;
      continue;
    }
    found = (found ?? []).map(keep);
    if (found.length === 0) {
      stats.skipped += 1;
      continue;
    }
    for (const row of found) {
      if (seen.has(row.url) || !session.permits(row.url)) {
        stats.skipped += 1;
        continue;
      }
      if (adapter.kind === 'vehicle') {
        const problems = vehicleProblems(row);
        if (problems.length > 0) {
          stats.skipped += 1;
          rejected.push({ url: row.url, problems });
          continue;
        }
      }
      seen.add(row.url);
      rows.push(row);
      if (rows.length >= cap) break;
    }
  }
  return result(rows, { capped: rows.length >= cap, ...(rejected.length ? { rejected: rejected.slice(0, 20) } : {}) });
}

function defaultExtract(kind) {
  return kind === 'vehicle'
    ? (html, ctx) => vehiclesFromHtml(html, ctx.url, ctx.name, ctx.capturedAt)
    : (html, ctx) => productsFromHtml(html, ctx.url, ctx.name, ctx.capturedAt);
}
