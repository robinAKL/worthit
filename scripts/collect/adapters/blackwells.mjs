/**
 * Blackwells group site. /pre-owned/ links /vehicle/<make>/<model>/<id>/.
 * Specs are heading/text columns. Seller enquiry blobs are not read.
 */
import { hrefsFromHtml } from '../core/discover.mjs';
import { bodyOf, ccOf, fuelOf, kmOf, priceOf, splitTitle, textOf, transmissionOf } from '../core/extract/specs.mjs';

const DETAIL = /^\/vehicle\/[a-z0-9-]+\/[a-z0-9-]+\/\d+\/?$/i;

export default {
  id: 'blackwells',
  name: 'Blackwells',
  origin: 'https://www.blackwells.co.nz',
  kind: 'vehicle',
  enabled: true,
  useSitemaps: false,
  listings: ['/pre-owned/'],
  imagePermission: false,
  isDetailUrl: (url) => DETAIL.test(new URL(url).pathname),
  linksFromListing: (html, origin) => {
    const urls = new Set(hrefsFromHtml(html, origin, (url) => DETAIL.test(new URL(url).pathname)));
    for (const match of String(html).matchAll(/data-link="(https:\/\/www\.blackwells\.co\.nz\/vehicle\/[^"]+)"/gi)) {
      const parsed = new URL(match[1]);
      if (DETAIL.test(parsed.pathname)) urls.add(parsed.href);
    }
    return [...urls];
  },
  extract: (html, { url, name, capturedAt }) => {
    const title = textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
    const yearInTitle = title.match(/\b(19[5-9]\d|20\d\d)\b/);
    const head = splitTitle(yearInTitle ? `${yearInTitle[1]} ${title.replace(yearInTitle[0], ' ')}` : title);
    const specs = headingValues(html);
    const priceNzd = priceOf(html.match(/class="vehicle-price">\s*([^<]+)/i)?.[1]);
    if (!head.make || !head.model || !head.year || !priceNzd) return [];
    const id = new URL(url).pathname.split('/').filter(Boolean).pop();
    const engine = specs.get('engine');
    return [
      {
        id: `car-blackwells-${id}`,
        dealer: name,
        url,
        capturedAt,
        make: head.make,
        model: head.model,
        variant: textOf(html.match(/class="variant">([^<]+)/i)?.[1]) || head.variant,
        year: head.year,
        odometerKm: kmOf(specs.get('kilometres')),
        priceNzd,
        fuel: fuelOf(specs.get('fuel type')),
        transmission: transmissionOf(specs.get('transmission')),
        body: bodyOf(specs.get('body')),
        engineCc: engine && !/^0\s*cc/i.test(engine) ? ccOf(engine) : undefined,
      },
    ];
  },
};

function headingValues(html) {
  const out = new Map();
  for (const match of String(html).matchAll(/class="col-xs-6 heading">\s*([^<]+?)\s*<\/div>\s*<div class="col-xs-6 text">\s*([^<]*?)\s*</gi)) {
    const key = textOf(match[1]).toLowerCase().replace(/:$/, '');
    const value = textOf(match[2]);
    if (key && value && !out.has(key)) out.set(key, value);
  }
  return out;
}
