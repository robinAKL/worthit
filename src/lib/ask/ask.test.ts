import { describe, expect, it } from 'vitest';
import { mockModel } from './claude';
import { factsFor } from './facts';
import { answer, buildUserMessage, makeHandler, rateLimiter, type Model } from './handler';
import { citedFacts, unsupportedNumbers } from './verify';

const post = (body: unknown) => new Request('http://x/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('Ask WorthIt: facts', () => {
  it('finds our own fridge listings for a fridge question, numbered F1, F2...', () => {
    const facts = factsFor({ question: 'fridge', locale: 'en' });
    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].id).toBe('F1');
    expect(facts.every((f) => /refrigerator|fridge|freezer/i.test(f.text))).toBe(true);
    expect(facts.every((f) => f.url?.startsWith('https://'))).toBe(true);
  });

  it('puts the asked-about car first, with its price and our estimate', () => {
    const anyCar = factsFor({ question: 'Toyota Aqua', locale: 'en' }).find((f) => f.kind === 'car')!;
    expect(anyCar).toBeDefined();
    const facts = factsFor({ question: 'is this worth it?', locale: 'en', carId: anyCar.ref });
    expect(facts[0].ref).toBe(anyCar.ref);
    expect(facts[0].text).toMatch(/asking \$[\d,]+ at .*our estimate \$[\d,]+/);
  });
});

describe('Ask WorthIt: number check', () => {
  const facts = [{ id: 'F1', kind: 'car' as const, text: '2013 Toyota Aqua; asking $9,990; 82,000 km; our estimate $12,300' }];

  it('accepts numbers copied from the facts and small counts', () => {
    expect(unsupportedNumbers('It asks $9,990 against our estimate of $12,300 [F1], one of 2 we found.', facts)).toEqual([]);
  });

  it('catches a made-up price or a rounded figure', () => {
    expect(unsupportedNumbers('It is about $10,000 [F1].', facts)).toEqual(['10000']);
    expect(unsupportedNumbers('That saves you $2,310.', facts)).toEqual(['2310']);
  });

  it('keeps only citations to facts we supplied', () => {
    expect(citedFacts('Yes [F1]. Also [F9]. Again [F1].', facts)).toEqual(['F1']);
  });

  it('withholds an answer that invents a number, and keeps one that does not', async () => {
    const liar: Model = async () => 'This fridge is $50 cheaper than anywhere else [F1].';
    const bad = await answer({ question: 'fridge', locale: 'en' }, liar);
    expect(bad.withheld).toBe(true);
    expect(bad.answer).not.toMatch(/\$50/);
    expect(bad.facts.length).toBeGreaterThan(0);

    const good = await answer({ question: 'fridge', locale: 'zh-Hans' }, mockModel);
    expect(good.withheld).toBe(false);
    expect(good.cited).toContain('F1');
  });

  it('gives the model only the question and the numbered facts', () => {
    const msg = buildUserMessage('fridge?', facts);
    expect(msg).toBe('Question: fridge?\n\nFacts:\n[F1] 2013 Toyota Aqua; asking $9,990; 82,000 km; our estimate $12,300');
  });
});

describe('Ask WorthIt: endpoint', () => {
  it('answers 503 with a clear message when no AI key is configured', async () => {
    const res = await makeHandler(null)(post({ question: 'fridge' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'ai_not_configured' });
  });

  it('rejects empty, overlong and non-POST requests, and rate-limits', async () => {
    const handler = makeHandler(mockModel, rateLimiter(2, 60_000));
    expect((await handler(post({ question: '  ' }))).status).toBe(400);
    expect((await handler(post({ question: 'x'.repeat(301) }))).status).toBe(400);
    expect((await handler(new Request('http://x/api/ask'))).status).toBe(405);
    const limited = makeHandler(mockModel, rateLimiter(1, 60_000));
    expect((await limited(post({ question: 'fridge' }))).status).toBe(200);
    expect((await limited(post({ question: 'fridge' }))).status).toBe(429);
  });

  it('returns the answer, the facts and what was cited', async () => {
    const res = await makeHandler(mockModel)(post({ question: 'fridge', locale: 'en' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.cited).toEqual(['F1', 'F2']);
    expect(body.facts[0].id).toBe('F1');
  });
});

describe('Ask WorthIt: context', () => {
  it('asked from a car card, adds only other cars of the same model', () => {
    const aqua = factsFor({ question: 'Toyota Aqua', locale: 'en' }).find((f) => f.kind === 'car')!;
    const facts = factsFor({ question: 'Is the price fair?', locale: 'en', carId: aqua.ref });
    expect(facts[0].ref).toBe(aqua.ref);
    expect(facts.every((f) => f.kind === 'car' && /Toyota Aqua/.test(f.text))).toBe(true);
  });

  it('asked from a product card, adds only items from its comparison group', () => {
    const fridge = factsFor({ question: 'fridge', locale: 'en' })[0];
    const facts = factsFor({ question: 'Is the price fair?', locale: 'en', productId: fridge.ref });
    expect(facts[0].ref).toBe(fridge.ref);
    expect(facts.every((f) => f.kind === 'product' && !/SAMPLE DATA/.test(f.text))).toBe(true);
  });
});
