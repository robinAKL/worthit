/**
 * Andrew Simms. Detail pages are /stock/details/<id>/<slug>, listed in /stock/sitemap.
 * The price sticker says when ORC is extra. JSON-LD supplies odometer and drivetrain.
 */
import { vehiclesFromHtml } from '../core/extract/jsonld.mjs';
import { priceOf, textOf } from '../core/extract/specs.mjs';

/** Used stock only. New cars on this site end in `-new` and are not part of the used-car contract. */
const DETAIL = /^\/stock\/details\/\d+\/[^/?#]*-used\/?$/i;

export default {
  id: 'andrew-simms',
  name: 'Andrew Simms',
  origin: 'https://www.andrewsimms.co.nz',
  kind: 'vehicle',
  enabled: true,
  sitemaps: ['/stock/sitemap'],
  imagePermission: false,
  isDetailUrl: (url) => DETAIL.test(new URL(url).pathname),
  extract: (html, { url, name, capturedAt }) => {
    const fromLd = vehiclesFromHtml(html, url, name, capturedAt)[0] ?? {};
    const year = Number(textOf(html.match(/class="year">([^<]+)/i)?.[1]));
    const make = textOf(html.match(/class="make">([^<]+)/i)?.[1]);
    const model = textOf(html.match(/class="model">([^<]+)/i)?.[1]);
    const priceNzd = priceOf(html.match(/class="price-value[^"]*">([^<]+)/i)?.[1]);
    if (!make || !model || !year || !(priceNzd || fromLd.priceNzd)) return [];
    const id = new URL(url).pathname.split('/')[3];
    return [
      {
        ...fromLd,
        id: `car-andrew-simms-${id}`,
        dealer: name,
        url,
        capturedAt,
        make,
        model,
        variant: textOf(html.match(/class="badge">([^<]+)/i)?.[1]) || fromLd.variant,
        year,
        priceNzd: priceNzd ?? fromLd.priceNzd,
        orcIncluded: /\+ ?ORC/i.test(html) ? false : fromLd.orcIncluded,
      },
    ];
  },
};
