import type { Locale } from '../types';
import { factsFor, type AskInput, type Fact } from './facts';
import { citedFacts, unsupportedNumbers } from './verify';

/** What the page receives. */
export interface AskAnswer {
  answer: string;
  facts: Fact[];
  cited: string[];
  /** True when the model's answer cited a number we could not find in the facts and was replaced. */
  withheld: boolean;
}

/** Calls the model with a system prompt and one user message; returns plain text. Injected for tests. */
export type Model = (system: string, user: string) => Promise<string>;

export const MAX_QUESTION = 300;

const SYSTEM: Record<Locale, string> = {
  en: [
    'You answer shoppers in New Zealand about products and used cars listed on WorthIt.',
    'Use only the numbered facts you are given. Cite each fact you use as [F1], [F2] and so on, right after the sentence that uses it.',
    'Copy prices, kilometres and sizes exactly as written in the facts. Do not round, convert or add up numbers, and do not mention any number that is not in the facts.',
    'If the facts do not answer the question, say so plainly and suggest what to check with the seller.',
    'If the question is short or vague (for example "why" or "worth it?"), answer whether the price looks fair against the facts.',
    'Format: line 1 is a one-sentence verdict of at most 25 words. Then a blank line, then at most three short sentences. No headings, no lists, no preamble about the question.',
    'No superlatives such as best or cheapest, no pressure to buy.',
    'Facts marked SAMPLE DATA are not real listings; say so if you use one.',
  ].join('\n'),
  'zh-Hans': [
    '你在 WorthIt 上回答新西兰用户关于商品和二手车的问题。',
    '只能使用给你的编号事实。每用到一条，就在那句话后面标注 [F1]、[F2] 这样的编号。',
    '价格、公里数、尺寸必须照抄事实里的写法，不要四舍五入、换算或相加，也不要写事实里没有的数字。',
    '如果事实回答不了这个问题，就直接说明，并建议向卖家核实什么。',
    '如果问题很短或很笼统（比如"为什么""值吗"），就回答这个价格和事实相比是否合理。',
    '格式：第一行是一句结论，不超过 40 个字。然后空一行，再写最多三句简短说明。不要标题、不要列表、不要复述问题。全部用中文。',
    '不要用"最好""最便宜"这类说法，不要催促购买。',
    '标有 SAMPLE DATA 的是示例数据，不是真实在售，如果用到要说明。',
  ].join('\n'),
};

const FALLBACK: Record<Locale, { noFacts: string; withheld: string }> = {
  en: {
    noFacts: 'We have nothing on WorthIt that answers this yet. Try a product or car name, or a budget.',
    withheld: 'We could not check every figure in that answer against our data, so we are not showing it. The facts we found are listed below.',
  },
  'zh-Hans': {
    noFacts: 'WorthIt 上暂时没有能回答这个问题的数据。可以换个商品名、车型或预算再试。',
    withheld: '这条回答里有数字无法和我们的数据对上，所以没有显示。下面列出了我们找到的事实。',
  },
};

export function buildUserMessage(question: string, facts: Fact[]): string {
  return [`Question: ${question}`, '', 'Facts:', ...facts.map((f) => `[${f.id}] ${f.text}`)].join('\n');
}

/** The whole ask flow, independent of HTTP: facts, model call, number check. */
export async function answer(input: AskInput, model: Model): Promise<AskAnswer> {
  const facts = factsFor(input);
  if (facts.length === 0) return { answer: FALLBACK[input.locale].noFacts, facts, cited: [], withheld: false };
  const text = (await model(SYSTEM[input.locale], buildUserMessage(input.question, facts))).trim();
  if (unsupportedNumbers(text, facts).length > 0) {
    return { answer: FALLBACK[input.locale].withheld, facts, cited: [], withheld: true };
  }
  return { answer: text, facts, cited: citedFacts(text, facts), withheld: false };
}

/** Tiny per-key limiter: `limit` requests per `windowMs`. In-memory, per server instance. */
export function rateLimiter(limit = 10, windowMs = 60_000) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) return false;
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/**
 * POST /api/ask  { question, locale?, productId?, carId? }
 * `model` is null when no AI credential is configured.
 */
export function makeHandler(model: Model | null, allow = rateLimiter()) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    if (!model) return json({ error: 'ai_not_configured', message: 'Set AI_GATEWAY_API_KEY on the server to turn on Ask WorthIt.' }, 503);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!allow(ip)) return json({ error: 'rate_limited' }, 429);
    let body: Partial<AskInput>;
    try {
      body = (await request.json()) as Partial<AskInput>;
    } catch {
      return json({ error: 'bad_json' }, 400);
    }
    const question = String(body.question ?? '').trim();
    if (!question) return json({ error: 'empty_question' }, 400);
    if (question.length > MAX_QUESTION) return json({ error: 'question_too_long', max: MAX_QUESTION }, 400);
    const locale: Locale = body.locale === 'zh-Hans' ? 'zh-Hans' : 'en';
    try {
      const result = await answer(
        { question, locale, productId: typeof body.productId === 'string' ? body.productId : undefined, carId: typeof body.carId === 'string' ? body.carId : undefined },
        model,
      );
      return json(result);
    } catch {
      return json({ error: 'model_failed' }, 502);
    }
  };
}
