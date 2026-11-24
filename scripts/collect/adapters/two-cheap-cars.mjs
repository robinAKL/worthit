/**
 * 2 Cheap Cars. Inventory sitemap lists /car/<id>/<slug>. Specs are one comma-separated line.
 * A "+ORC" sticker means the shown price does not include on-road costs.
 */
import { bodyOf, ccOf, fuelOf, kmOf, priceOf, splitTitle, textOf, transmissionOf } from '../core/extract/specs.mjs';

const DETAIL = /^\/car\/\d+\//i;

export default {
  id: 'two-cheap-cars',
  name: '2 Cheap Cars',
  origin: 'https://www.2cheapcars.co.nz',
  kind: 'vehicle',
  enabled: true,
  sitemaps: ['/sitemap-inventory.xml'],
  imagePermission: false,
  isDetailUrl: (url) => DETAIL.test(new URL(url).pathname),
  extract: (html, { url, name, capturedAt }) => {
    const title = textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
    const head = splitTitle(title);
    const priceNzd = priceOf(html.match(/class="price-sticker__amount">([^<]+)/i)?.[1]);
    if (!head.make || !head.model || !head.year || !priceNzd) return [];
    const specs = textOf(html.match(/class="vehicle-specs">([^<]+)/i)?.[1]);
    const id = new URL(url).pathname.split('/').filter(Boolean)[1];
    return [
      {
        id: `car-2cheap-${id}`,
        dealer: name,
        url,
        capturedAt,
        make: head.make,
        model: head.model,
        variant: head.variant,
        year: head.year,
        odometerKm: kmOf(specs),
        priceNzd,
        orcIncluded: /price-sticker__orc">\s*\+/i.test(html) ? false : undefined,
        fuel: fuelOf(specs),
        transmission: transmissionOf(specs),
        body: bodyOf(specs),
        engineCc: ccOf(specs),
      },
    ];
  },
};
