/** Brian Scott Motors, Dunedin. Motorcentral template, no sitemap (404); robots blocks /Motorcentral/ and admin paths, not /vehicle/. */
import * as mc from './platforms/motorcentral.mjs';

export default {
  id: 'brian-scott',
  name: 'Brian Scott Motors',
  origin: 'https://www.brianscottmotors.co.nz',
  kind: 'vehicle',
  enabled: true,
  useSitemaps: false,
  listings: mc.listingPages(2),
  isDetailUrl: mc.isDetailUrl,
  linksFromListing: mc.linksFromListing,
  extract: (html, ctx) => mc.extract(html, ctx, { region: 'Otago' }),
};
