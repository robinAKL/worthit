// The enrichment script is plain JavaScript. This file checks behaviour, not types.
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { enrich, needsAi } from '../../scripts/enrich/specs.mjs';

const products = [
  { id: 'a', title: 'Midea MDRD181FGM01AP 124L Bar Fridge' }, // rules cover it
  { id: 'b', title: 'Fisher & Paykel RF610ADX6 Fridge, 569 Litres, French Door' }, // rules find the family but not the size
  { id: 'c', title: 'Haier HWF75AW3 Front Loader 7.5kg' }, // rules find no family
  { id: 'd', title: 'Star Wars Washcloths 3-pack' }, // not an appliance
];

describe('AI spec enrichment', () => {
  it('asks only about titles the rules cannot size', () => {
    expect(needsAi(products[0].title)).toBe(false);
    expect(needsAi(products[1].title)).toBe(true);
    expect(needsAi(products[2].title)).toBe(true);
  });

  it('keeps only values backed by the title, caches them, and never asks twice', async () => {
    const asked: string[] = [];
    const replies = {
      b: { family: 'fridge', style: 'french-door', size: 569, evidence: { family: 'Fridge', style: 'French Door', size: '569 Litres' } },
      // A made-up size with no evidence in the title must be dropped, the family kept.
      c: { family: 'washer', style: 'front-load', size: 8, evidence: { family: 'Front Loader', size: '8kg' } },
      d: { family: 'unknown', style: null, size: null, evidence: { family: '' } },
    };
    const extract = async (title) => {
      const p = products.find((x) => x.title === title);
      asked.push(p.id);
      return replies[p.id];
    };
    const cache = {};
    const first = await enrich({ products, cache, extract });
    expect(asked).toEqual(['b', 'c', 'd']);
    expect(cache.b).toMatchObject({ family: 'fridge', style: 'french-door', size: 569, unit: 'L', source: 'ai' });
    // "Front Loader" is in the title, so the family stands; "8kg" is not, so the size is dropped.
    expect(cache.c).toMatchObject({ family: 'washer', source: 'ai' });
    expect(cache.c.size).toBeUndefined();
    expect(cache.d).toBe(false); // asked once, nothing usable, remembered so it is not asked again
    expect(first.rulesOnly).toBe(1);

    asked.length = 0;
    const second = await enrich({ products, cache, extract });
    expect(asked).not.toContain('b');
    expect(asked).toEqual([]);
    expect(second.cached).toBe(3);
  });

  it('skips a title when the call fails, without stopping the run', async () => {
    const cache = {};
    const stats = await enrich({
      products: [products[1]],
      cache,
      extract: async () => {
        throw new Error('rate limited');
      },
    });
    expect(stats.asked).toBe(1);
    expect(cache).toEqual({});
  });
});

describe('AI route', () => {
  it('uses Vercel AI Gateway when AI_GATEWAY_API_KEY is set, the Claude API otherwise', async () => {
    const { routeFor } = await import('../../scripts/enrich/specs.mjs');
    expect(routeFor({ AI_GATEWAY_API_KEY: 'test-key' })).toEqual({
      gateway: true,
      clientOptions: { apiKey: 'test-key', baseURL: 'https://ai-gateway.vercel.sh' },
      model: 'anthropic/claude-opus-5.5',
    });
    expect(routeFor({})).toEqual({ gateway: false, clientOptions: {}, model: 'claude-opus-5-5' });
    expect(routeFor({ AI_GATEWAY_API_KEY: 'k', WORTHIT_AI_MODEL: 'anthropic/claude-haiku-5.5' }).model).toBe('anthropic/claude-haiku-5.5');
  });
});
