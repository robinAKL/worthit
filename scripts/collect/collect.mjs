/**
 * Compatibility entry. The collector now lives in core/ (rules) and adapters/ (one file per site).
 * `collectSite` keeps the T-17 signature by wrapping a site config into a product adapter.
 */
import { runAdapter } from './core/runner.mjs';

export { keepProductFacts as keepFacts } from './core/facts.mjs';
export { productUrlsFromHtml } from './core/discover.mjs';

export async function collectSite({ site, limit, minIntervalMs, userAgent, fetchImpl, now, sleep, capturedAt }) {
  const adapter = {
    id: site.id,
    name: site.name,
    origin: site.origin,
    kind: 'product',
    enabled: site.enabled !== false,
    disabledReason: site.enabled === false ? 'disabled in config' : undefined,
  };
  const { rows, saved, ...stats } = await runAdapter({ adapter, limit, minIntervalMs, userAgent, fetchImpl, now, sleep, capturedAt });
  delete stats.kind;
  return { ...stats, saved, products: rows };
}
