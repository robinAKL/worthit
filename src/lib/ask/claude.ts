import type { Model } from './handler';

/**
 * Server-only. Picks how Ask WorthIt reaches Claude:
 * - AI_GATEWAY_API_KEY set: Vercel AI Gateway (Anthropic-compatible endpoint, gateway billing).
 * - ANTHROPIC_API_KEY set: the Claude API directly, with server-side refusal fallback.
 * - WORTHIT_ASK_MOCK=1: a canned reply for local preview, no network.
 * Returns null when none is configured, and the endpoint answers 503.
 */
export async function modelFromEnv(env: Record<string, string | undefined>): Promise<Model | null> {
  if (env.WORTHIT_ASK_MOCK === '1') return mockModel;
  if (!env.AI_GATEWAY_API_KEY && !env.ANTHROPIC_API_KEY) return null;
  const { default: Anthropic } = await import('@anthropic-ai/sdk');

  if (env.AI_GATEWAY_API_KEY) {
    const client = new Anthropic({ apiKey: env.AI_GATEWAY_API_KEY, baseURL: 'https://ai-gateway.vercel.sh' });
    const model = env.WORTHIT_ASK_MODEL || 'anthropic/claude-sonnet-5.5';
    return async (system, user) => {
      const response = await client.messages.create({
        model,
        max_tokens: 1000,
        output_config: { effort: 'low' },
        system,
        messages: [{ role: 'user', content: user }],
      });
      if (response.stop_reason === 'refusal') return '';
      return response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    };
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.WORTHIT_ASK_MODEL || 'claude-sonnet-5-5';
  return async (system, user) => {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 1000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: user }],
    });
    if (response.stop_reason === 'refusal') return '';
    return response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  };
}

/** Local preview only: cites the first two facts, states no numbers of its own. */
export const mockModel: Model = async (system, user) => {
  const zh = system.includes('你在 WorthIt');
  const ids = [...user.matchAll(/^\[(F\d+)\]/gm)].map((m) => m[1]).slice(0, 2);
  if (ids.length === 0) return zh ? '暂时没有相关数据。' : 'We have nothing on this yet.';
  return zh
    ? `（预览模式，未调用 AI）最接近你问题的是下面这条 [${ids[0]}]。${ids[1] ? `也可以对比 [${ids[1]}]。` : ''}下单前请向卖家核实车况或配置。`
    : `(Preview mode, no AI call.) The closest match to your question is this one [${ids[0]}].${ids[1] ? ` You could also compare it with [${ids[1]}].` : ''} Check condition and specs with the seller before you buy.`;
};
