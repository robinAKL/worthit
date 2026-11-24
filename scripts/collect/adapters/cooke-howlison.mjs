/** Cooke Howlison, Dunedin (BMW/MINI). /stock/sitemap lists new and used stock; only "-used" pages are read. Pages carry schema.org Car JSON-LD. */
import { vehiclesFromHtml } from '../core/extract/jsonld.mjs';

export default {
  id: 'cooke-howlison',
  name: 'Cooke Howlison',
  origin: 'https://www.cookehowlison.co.nz',
  kind: 'vehicle',
  enabled: true,
  sitemaps: ['/stock/sitemap'],
  isDetailUrl: (url) => /^\/stock\/details\/\d+\/[^/]+-used$/.test(new URL(url).pathname),
  extract: (html, ctx) => vehiclesFromHtml(html, ctx.url, ctx.name, ctx.capturedAt).map((row) => ({ ...row, region: 'Otago' })),
};
