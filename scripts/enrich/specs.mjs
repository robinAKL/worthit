/**
 * node scripts/enrich/specs.mjs [--ai] [--limit=<n>]
 *
 * Reads product titles from src/data/feeds/*.json. Rules (src/lib/specs.ts) cover most titles.
 * With --ai, titles the rules cannot size are sent to Claude, which returns JSON only; every
 * value must quote a fragment of the title, and anything it cannot back up is dropped.
 * Results go to src/data/specs/ai.json, keyed by product id, so a title is asked about once.
 *
 * Credentials come from the environment: AI_GATEWAY_API_KEY routes through Vercel AI Gateway;
 * otherwise ANTHROPIC_API_KEY or an `ant auth login` profile. WORTHIT_AI_MODEL overrides the model.
 * Never commit a key, never paste one into chat.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const { specFromTitle, verifySpec, factsText, FAMILY_UNIT } = await import('../../src/lib/specs.ts');

export const FAMILIES = ['fridge', 'freezer', 'washer', 'dryer', 'microwave', 'dishwasher', 'oven', 'cooktop', 'car-seat', 'laptop', 'combo', 'accessory'];

/** What the model reads and what every value is checked against: the title plus the structured facts the collector kept. */
export function sourceText(product) {
  return [product.title, factsText(product.specs)].filter(Boolean).join(' | ');
}

/** A product needs the AI step when the rules find no family, or a sized family without a size. */
export function needsAi(productOrTitle) {
  const text = typeof productOrTitle === 'string' ? productOrTitle : sourceText(productOrTitle);
  const spec = specFromTitle(text);
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
    if (!needsAi(product)) {
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
      raw = await extract(sourceText(product));
    } catch (error) {
      log(`skip ${product.id}: ${error?.message ?? error}`);
      continue;
    }
    const spec = raw && raw.family !== 'unknown' ? verifySpec(sourceText(product), raw) : null;
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

/**
 * Where the call goes. With AI_GATEWAY_API_KEY set, requests go through Vercel AI Gateway
 * (Anthropic-compatible endpoint, gateway model ids, gateway billing and provider failover).
 * Otherwise they go straight to the Claude API with the SDK's usual credentials, and a
 * declined request falls back server-side.
 */
export function routeFor(env = process.env) {
  if (env.AI_GATEWAY_API_KEY) {
    return { gateway: true, clientOptions: { apiKey: env.AI_GATEWAY_API_KEY, baseURL: 'https://ai-gateway.vercel.sh' }, model: env.WORTHIT_AI_MODEL || 'anthropic/claude-opus-5.5' };
  }
  return { gateway: false, clientOptions: {}, model: env.WORTHIT_AI_MODEL || 'claude-opus-5-5' };
}

/** The Claude call: JSON only, every value tied to a quoted title fragment. */
export async function claudeExtractor(route = routeFor()) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
  const { zodOutputFormat } = await import('@anthropic-ai/sdk/helpers/zod');
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
    // How sure the reading is, 0 to 1, per field. Below 0.6 the field is dropped.
    confidence: z.object({
      family: z.number(),
      style: z.number().nullable(),
      size: z.number().nullable(),
    }),
  });
  const client = new Anthropic(route.clientOptions);
  const system = [
    'You read New Zealand retail product titles and return the product family, style and size as JSON.',
    'Size means litres for fridges, freezers, microwaves and ovens; kilograms for washers and dryers; place settings for dishwashers.',
    'For every value you return, copy the exact words from the title that show it into `evidence`. If the title does not state a value, return null for it. Never infer a size from a model number.',
    'Use family "unknown" when the title is none of the listed families.',
    'Give a confidence from 0 to 1 for each value: 1 when the words state it outright, lower when you are reading between the lines.',
  ].join('\n');

  return async (title) => {
    const messages = [{ role: 'user', content: `Product text: ${title}` }];
    // The gateway documents the GA structured-output path; the refusal-fallback beta is used only on the direct API.
    const response = route.gateway
      ? await client.messages.parse({ model: route.model, max_tokens: 2000, output_config: { effort: 'low', format: zodOutputFormat(Spec) }, system, messages })
      : await client.beta.messages.parse({
          model: route.model,
          max_tokens: 2000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low', format: betaZodOutputFormat(Spec) },
          system,
          messages,
        });
    if (response.stop_reason === 'refusal') return null;
    const out = response.parsed_output;
    if (!out) return null;
    return {
      family: out.family,
      style: out.style ?? undefined,
      size: out.size ?? undefined,
      evidence: Object.fromEntries(Object.entries(out.evidence).filter(([, v]) => v)),
      confidence: Object.fromEntries(Object.entries(out.confidence).filter(([, v]) => v !== null)),
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
  const waiting = products.filter((p) => needsAi(p) && !(p.id in cache));
  if (!useAi) {
    console.log(JSON.stringify({ products: products.length, rulesOnly: products.length - products.filter((p) => needsAi(p)).length, waitingForAi: waiting.length, note: 'run with --ai to fill these from Claude' }, null, 2));
    return;
  }
  const route = routeFor();
  console.error(`AI step via ${route.gateway ? 'Vercel AI Gateway' : 'Claude API'}, model ${route.model}`);
  const extract = await claudeExtractor(route);
  const stats = await enrich({ products, cache, extract, limit, log: (m) => console.error(m) });
  writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(JSON.stringify(stats, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
