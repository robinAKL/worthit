/** Genuine Vehicle Imports (gvi.kiwi). Motorcentral template; the sitemap lists every /vehicle/ page. robots allows all. */
import * as mc from './platforms/motorcentral.mjs';

export default {
  id: 'gvi',
  name: 'Genuine Vehicle Imports',
  origin: 'https://www.gvi.kiwi',
  kind: 'vehicle',
  enabled: true,
  isDetailUrl: mc.isDetailUrl,
  extract: (html, ctx) => mc.extract(html, ctx),
};
