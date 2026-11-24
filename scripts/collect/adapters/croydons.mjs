/** Croydons Wholesalers, Henderson, Auckland. Motorcentral template, no sitemap (404); robots blocks /Motorcentral/ and admin paths, not /vehicle/. */
import * as mc from './platforms/motorcentral.mjs';

export default {
  id: 'croydons',
  name: 'Croydons',
  origin: 'https://www.croydons.co.nz',
  kind: 'vehicle',
  enabled: true,
  useSitemaps: false,
  listings: mc.listingPages(2),
  isDetailUrl: mc.isDetailUrl,
  linksFromListing: mc.linksFromListing,
  extract: (html, ctx) => mc.extract(html, ctx, { region: 'Auckland' }),
};
