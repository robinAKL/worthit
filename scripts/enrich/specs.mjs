/**
 * node scripts/enrich/specs.mjs [--ai] [--limit=<n>]
 *
 * Reads product titles from src/data/feeds/*.json. Rules (src/lib/specs.ts) cover most titles.
 * With --ai, titles the rules cannot size are sent to Claude, which returns JSON only; every
 * value must quote a fragment of the title, and anything it cannot back up is dropped.
 * Results go to src/data/specs/ai.json, keyed by product id, so a title is asked about once.
 *
 * Credentials come from the environment (ANTHROPIC_API_KEY or an `ant auth login` profile).
 * Never commit a key, never paste one into chat.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const { specFromTitle, verifySpec, FAMILY_UNIT } = await import('../../src/lib/specs.ts');

export const FAMILIES = ['fridge', 'freezer', 'washer', 'dryer', 'microwave', 'dishwasher', 'oven', 'cooktop', 'car-seat', 'combo', 'accessory'];

/** A title needs the AI step when the rules find no family, or a sized family without a size. */
export function needsAi(title) {
  const spec = specFromTitle(title);
  if (!spec) return true;
  return Boolean(FAMILY_UNIT[spec.family]) && spec.size === undefined;
}

/**
 * Fill the cache for products the rules miss. `extract(title)` returns the model's raw JSON
 * (or null); it is injected so tests run without a network.
 */
export async function enrich({ products, cache, extract, limit = Infinity, log = () => {} }) {
  const stats = { asked: 0, kept: 0, dropped: 0, cached: 0, rulesOnly: 0 };
  for (const product of products) {
    if (!needsAi(product.title)) {
      stats.rulesOnly += 1;
      continue;
    }
    // `false` records a title we already asked about and could not use, so it is not asked again.
    if (product.id in cache) {
      stats.cached += 1;
      continue;
    }
    if (stats.asked >= limit) break;
    stats.asked += 1;
    let raw = null;
    try {
      raw = await extract(product.title);
    } catch (error) {
      log(`skip ${product.id}: ${error?.message ?? error}`);
      continue;
    }
    const spec = raw && raw.family !== 'unknown' ? verifySpec(product.title, raw) : null;
    if (spec) {
      cache[product.id] = spec;
      stats.kept += 1;
    } else {
      cache[product.id] = false;
      stats.dropped += 1;
    }
  }
  return stats;
}

/** The Claude call: JSON only, every value tied to a quoted title fragment. */
export async function claudeExtractor() {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
  const { z } = await import('zod');
  const Spec = z.object({
    family: z.enum([...FAMILIES, 'unknown']),
    style: z.string().nullable(),
    size: z.number().nullable(),
    evidence: z.object({
      family: z.string(),
      style: z.string().nullable(),
      size: z.string().nullable(),
    }),
  });
  const client = new Anthropic();
  const system = [
    'You read New Zealand retail product titles and return the product family, style and size as JSON.',
    'Size means litres for fridges, freezers, microwaves and ovens; kilograms for washers and dryers; place settings for dishwashers.',
    'For every value you return, copy the exact words from the title that show it into `evidence`. If the title does not state a value, return null for it. Never infer a size from a model number.',
    'Use family "unknown" when the title is none of the listed families.',
  ].join('\n');

  return async (title) => {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(Spec) },
      system,
      messages: [{ role: 'user', content: `Title: ${title}` }],
    });
    if (response.stop_reason === 'refusal') return null;
    const out = response.parsed_output;
    if (!out) return null;
    return {
      family: out.family,
      style: out.style ?? undefined,
      size: out.size ?? undefined,
      evidence: Object.fromEntries(Object.entries(out.evidence).filter(([, v]) => v)),
    };
  };
}

async function main() {
  const useAi = process.argv.includes('--ai');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
  const feedsDir = join(root, 'src', 'data', 'feeds');
  const products = readdirSync(feedsDir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(feedsDir, f), 'utf8')).products ?? []);
  const cachePath = join(root, 'src', 'data', 'specs', 'ai.json');
  const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
  const waiting = products.filter((p) => needsAi(p.title) && !(p.id in cache));
  if (!useAi) {
    console.log(JSON.stringify({ products: products.length, rulesOnly: products.length - products.filter((p) => needsAi(p.title)).length, waitingForAi: waiting.length, note: 'run with --ai to fill these from Claude' }, null, 2));
    return;
  }
  const extract = await claudeExtractor();
  const stats = await enrich({ products, cache, extract, limit, log: (m) => console.error(m) });
  writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(JSON.stringify(stats, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
