/** Auto Court Dunedin. Motorcentral template; the sitemap lists every /vehicle/ page. Terms: none found (T-18), robots allows all. */
import * as mc from './platforms/motorcentral.mjs';

export default {
  id: 'auto-court',
  name: 'Auto Court',
  origin: 'https://www.autocourt.net.nz',
  kind: 'vehicle',
  enabled: true,
  isDetailUrl: mc.isDetailUrl,
  extract: (html, ctx) => mc.extract(html, ctx, { region: 'Otago' }),
};
