/**
 * node scripts/collect/run.mjs [--site=<id>] [--limit=<n>] [--dry-run]
 *
 * Products go to src/data/feeds/<id>.json after parseFeed validation.
 * Vehicles go to src/data/feeds/cars/<id>.json.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTERS } from './adapters/index.mjs';
import { USER_AGENT } from './core/policy.mjs';
import { recordHistory } from './history.mjs';
import { runAdapter } from './core/runner.mjs';
import { reconcileFeed } from '../../src/lib/feed/reconcile.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const config = JSON.parse(readFileSync(join(here, 'sites.json'), 'utf8'));

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const requested = arg('limit') ? Number(arg('limit')) : config.pilotLimit;
const onlySite = arg('site') ?? '';
const dryRun = process.argv.includes('--dry-run');
const userAgent = config.userAgent || USER_AGENT;
if (!/WorthItBot\/0\.1 \(\+.+\)/.test(userAgent)) {
  console.error('User-Agent must be WorthItBot/0.1 (+contact). Refusing to run with an empty contact.');
  process.exit(1);
}
if (onlySite && !ADAPTERS.some((a) => a.id === onlySite)) {
  console.error(`No adapter with id "${onlySite}". Known: ${ADAPTERS.map((a) => a.id).join(', ')}`);
  process.exit(1);
}

const { parseFeed } = await import('../../src/lib/feed/parseFeed.ts');

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Write the merged feed only when this collect is safe to keep. A stop or an empty result leaves the files alone. */
function commitFeed(feedPath, presencePath, listKey, existing, incoming, misses, { stopped, capped }) {
  const decision = reconcileFeed(existing, incoming, misses, { stopped, capped });
  if (!decision.wrote) return decision;
  mkdirSync(dirname(feedPath), { recursive: true });
  mkdirSync(dirname(presencePath), { recursive: true });
  writeFileSync(feedPath, `${JSON.stringify({ [listKey]: decision.items }, null, 2)}\n`);
  writeFileSync(presencePath, `${JSON.stringify(decision.misses, null, 2)}\n`);
  return decision;
}

async function fetchImpl(url, { userAgent: agent }) {
  const response = await fetch(url, {
    headers: { 'user-agent': agent, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5' },
    redirect: 'follow',
  });
  return { status: response.status, body: await response.text(), url: response.url };
}

/** URLs already stored for a site, oldest capture first, so a run reaches new items before refreshing old ones. */
function knownUrls(adapter) {
  const path = adapter.kind === 'product'
    ? join(root, 'src', 'data', 'feeds', `${adapter.id}.json`)
    : join(root, 'src', 'data', 'feeds', 'cars', `${adapter.id}.json`);
  const feed = readJson(path, {});
  const items = feed.products ?? feed.vehicles ?? [];
  return [...items].sort((a, b) => String(a.capturedAt).localeCompare(String(b.capturedAt))).map((item) => item.url).filter(Boolean);
}

const summary = [];
for (const adapter of ADAPTERS) {
  if (onlySite && adapter.id !== onlySite) continue;
  const result = await runAdapter({ adapter, limit: requested, minIntervalMs: config.minIntervalMs, maxPerRun: config.maxPerRun, userAgent, fetchImpl, known: knownUrls(adapter) });
  const { rows, ...stats } = result;
  const stopped = Boolean(stats.stopped);
  const capped = Boolean(stats.capped);

  if (!dryRun) {
    if (adapter.kind === 'product') {
      const feedPath = join(root, 'src', 'data', 'feeds', `${adapter.id}.json`);
      const presencePath = join(root, 'src', 'data', 'presence', `${adapter.id}.json`);
      const existing = readJson(feedPath, { products: [] }).products ?? [];
      const misses = readJson(presencePath, {});
      let incoming = [];
      if (!stopped && rows.length > 0) {
        const parsed = parseFeed(JSON.stringify({ products: rows }));
        if (parsed.errors.length > 0) {
          console.error(adapter.id, parsed.errors.slice(0, 5));
          process.exit(1);
        }
        incoming = parsed.products.map(({ imageUrl, rating, reviewCount, ...rest }) => {
          void imageUrl;
          void rating;
          void reviewCount;
          return { ...rest, currency: 'NZD' };
        });
      }
      const decision = commitFeed(feedPath, presencePath, 'products', existing, incoming, misses, { stopped, capped });
      if (decision.wrote) recordHistory(root, adapter.id, incoming);
      stats.saved = decision.items.length;
      stats.dropped = decision.dropped.length;
      stats.wrote = decision.wrote;
    } else {
      const feedPath = join(root, 'src', 'data', 'feeds', 'cars', `${adapter.id}.json`);
      const presencePath = join(root, 'src', 'data', 'presence', 'cars', `${adapter.id}.json`);
      const existing = readJson(feedPath, { vehicles: [] }).vehicles ?? [];
      const misses = readJson(presencePath, {});
      const incoming = stopped ? [] : rows;
      const decision = commitFeed(feedPath, presencePath, 'vehicles', existing, incoming, misses, { stopped, capped });
      stats.saved = decision.items.length;
      stats.dropped = decision.dropped.length;
      stats.wrote = decision.wrote;
    }
  }
  console.log(
    `${adapter.id} requests=${stats.requests ?? 0} skipped=${stats.skipped ?? 0} errors=${stats.errors ?? 0} stopped=${stats.stopped || '-'} saved=${stats.saved ?? 0} dropped=${stats.dropped ?? 0} wrote=${stats.wrote ?? false}`,
  );
  summary.push(stats);
}

console.log(JSON.stringify(summary, null, 2));
