/**
 * node scripts/collect/run.mjs [--site=<id>] [--limit=<n>] [--dry-run]
 *
 * Products go to src/data/feeds/<id>.json after parseFeed validation.
 * Vehicles go to src/data/feeds/cars/<id>.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTERS } from './adapters/index.mjs';
import { USER_AGENT } from './core/policy.mjs';
import { recordHistory } from './history.mjs';
import { runAdapter } from './core/runner.mjs';

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

async function fetchImpl(url, { userAgent: agent }) {
  const response = await fetch(url, {
    headers: { 'user-agent': agent, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5' },
    redirect: 'follow',
  });
  return { status: response.status, body: await response.text(), url: response.url };
}

const summary = [];
for (const adapter of ADAPTERS) {
  if (onlySite && adapter.id !== onlySite) continue;
  const result = await runAdapter({ adapter, limit: requested, minIntervalMs: config.minIntervalMs, maxPerRun: config.maxPerRun, userAgent, fetchImpl });
  const { rows, ...stats } = result;

  if (!dryRun && rows.length > 0) {
    if (adapter.kind === 'product') {
      const parsed = parseFeed(JSON.stringify({ products: rows }));
      if (parsed.errors.length > 0) {
        console.error(adapter.id, parsed.errors.slice(0, 5));
        process.exit(1);
      }
      const clean = parsed.products.map(({ imageUrl, rating, reviewCount, ...rest }) => {
        void imageUrl;
        void rating;
        void reviewCount;
        return { ...rest, currency: 'NZD' };
      });
      writeFileSync(join(root, 'src', 'data', 'feeds', `${adapter.id}.json`), `${JSON.stringify({ products: clean }, null, 2)}\n`);
      recordHistory(root, adapter.id, clean);
      stats.saved = clean.length;
    } else {
      const dir = join(root, 'src', 'data', 'feeds', 'cars');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${adapter.id}.json`), `${JSON.stringify({ vehicles: rows }, null, 2)}\n`);
    }
  }
  summary.push(stats);
}

console.log(JSON.stringify(summary, null, 2));
