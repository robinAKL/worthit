/**
 * Brendan Foot Supersite, Lower Hutt. WordPress; the used-stock page links /car/<make>/<model>-<plate>/.
 * No vehicle JSON-LD, so facts come from the Specifications table and the price block.
 * The plate is only used for a one-way dedupeKey.
 */
import { bodyOf, ccOf, fuelOf, kmOf, labelledValues, pick, priceOf, regionOf, textOf, transmissionOf } from '../core/extract/specs.mjs';

const DETAIL = /^\/car\/[a-z0-9-]+\/[a-z0-9-]+\/?$/i;

export default {
  id: 'brendan-foot',
  name: 'Brendan Foot Supersite',
  origin: 'https://brendanfoot.co.nz',
  kind: 'vehicle',
  enabled: true,
  useSitemaps: false,
  listings: ['/cars/?new=false&demo=false&used=true'],
  isDetailUrl: (url) => DETAIL.test(new URL(url).pathname),
  linksFromListing: (html, origin) => {
    const urls = new Set();
    for (const m of String(html).matchAll(/https:\/\/brendanfoot\.co\.nz\/car\/[a-z0-9-]+\/[a-z0-9-]+\//gi)) urls.add(new URL(m[0], origin).href);
    return [...urls];
  },
  extract: (html, { url, name, capturedAt }) => {
    const values = labelledValues(html);
    const make = pick(values, 'make');
    if (!make) return [];
    const price = html.match(/class="vehicle-price"[^>]*>\s*<div class="price">([^<]+)</i)?.[1];
    return [
      {
        id: `car-bfs-${pick(values, 'stock no') ?? new URL(url).pathname.split('/').filter(Boolean).join('-')}`,
        dealer: name,
        url,
        capturedAt,
        make,
        model: pick(values, 'model'),
        variant: pick(values, 'variant'),
        year: Number(pick(values, 'year')) || undefined,
        odometerKm: kmOf(pick(values, 'odometer', 'odomoter')),
        priceNzd: priceOf(textOf(price)),
        fuel: fuelOf(pick(values, 'fuel')),
        transmission: transmissionOf(pick(values, 'transmission')),
        body: bodyOf(pick(values, 'type', 'body')),
        engineCc: ccOf(pick(values, 'engine')),
        region: regionOf(pick(values, 'yard')),
        plate: pick(values, 'registration no'),
      },
    ];
  },
};
