/** AJ Motors. Motorcentral: /vehicle/<slug>/<stock> and schema.org/Car. robots.txt allows the vehicle paths. */
import * as mc from './platforms/motorcentral.mjs';

export default {
  id: 'aj-motors',
  name: 'AJ Motors',
  origin: 'https://www.ajmotors.co.nz',
  kind: 'vehicle',
  enabled: true,
  imagePermission: false,
  isDetailUrl: mc.isDetailUrl,
  linksFromListing: mc.linksFromListing,
  listings: mc.listingPages(1),
  extract: (html, ctx) => mc.extract(html, ctx),
};
