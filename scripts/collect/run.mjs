import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSite } from './collect.mjs';
import { USER_AGENT } from './policy.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const config = JSON.parse(readFileSync(join(here, 'sites.json'), 'utf8'));

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const siteArg = process.argv.find((arg) => arg.startsWith('--site='));
const requested = limitArg ? Number(limitArg.slice('--limit='.length)) : config.pilotLimit;
const onlySite = siteArg ? siteArg.slice('--site='.length) : '';
const userAgent = config.userAgent || USER_AGENT;
if (!/WorthItBot\/0\.1 \(\+.+\)/.test(userAgent)) {
  console.error('User-Agent must be WorthItBot/0.1 (+contact). Refusing to run with an empty contact.');
  process.exit(1);
}

const { parseFeed } = await import('../../src/lib/feed/parseFeed.ts');

async function fetchImpl(url, { userAgent: agent }) {
  const response = await fetch(url, {
    headers: { 'user-agent': agent, accept: 'text/html,application/xml,text/plain' },
    redirect: 'follow',
  });
  return { status: response.status, body: await response.text(), url: response.url };
}

const summary = [];
for (const site of config.sites) {
  if (onlySite && site.id !== onlySite) continue;
  if (!site.enabled) {
    summary.push({ id: site.id, requests: 0, skipped: 0, errors: 0, saved: 0, stopped: 'disabled' });
    continue;
  }
  const result = await collectSite({
    site,
    limit: requested,
    minIntervalMs: config.minIntervalMs,
    userAgent,
    fetchImpl,
  });
  const parsed = parseFeed(JSON.stringify({ products: result.products }));
  if (parsed.errors.length > 0) {
    console.error(site.id, parsed.errors.slice(0, 5));
    process.exit(1);
  }
  const clean = parsed.products.map((product) => {
    const { imageUrl, rating, reviewCount, ...rest } = product;
    void imageUrl;
    void rating;
    void reviewCount;
    return { ...rest, currency: 'NZD' };
  });
  writeFileSync(join(root, 'src', 'data', 'feeds', `${site.id}.json`), `${JSON.stringify({ products: clean }, null, 2)}\n`);
  summary.push({
    id: site.id,
    requests: result.requests,
    skipped: result.skipped,
    errors: result.errors,
    saved: clean.length,
    stopped: result.stopped,
  });
}

console.log(JSON.stringify(summary, null, 2));
