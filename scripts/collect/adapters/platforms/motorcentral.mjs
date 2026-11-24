/**
 * Shared pieces for dealer sites built on the Motorcentral template
 * (/vehicles listing, /vehicle/<slug>/<stock-id> detail, schema.org Car microdata,
 * a label/value spec table and a price block). Used by several adapters.
 */
import { hrefsFromHtml } from '../../core/discover.mjs';
import { bodyOf, ccOf, fuelOf, kmOf, labelledValues, pick, priceOf, splitTitle, textOf, tidyName, transmissionOf } from '../../core/extract/specs.mjs';

const DETAIL = /^\/vehicle\/[^/]+\/\d+$/;

export const isDetailUrl = (url) => DETAIL.test(new URL(url).pathname);

/** Detail links on a listing page, without the `?s=1` tracking query. */
export function linksFromListing(html, origin) {
  return hrefsFromHtml(html, origin, (url) => DETAIL.test(new URL(url).pathname)).map((url) => {
    const u = new URL(url);
    u.search = '';
    return u.href;
  });
}

/** `/vehicles`, then `/vehicles?Page=2` ... up to `pages`. */
export const listingPages = (pages) => ['/vehicles', ...Array.from({ length: pages - 1 }, (_, i) => `/vehicles?Page=${i + 2}`)];

export function extract(html, { url, name, capturedAt }, { region } = {}) {
  if (!/itemtype="https?:\/\/schema\.org\/Car"/i.test(html)) return [];
  // Dealers fill different slots: itemprop name, og:title, <title>, or the first <h2>. Take the first that starts with a year.
  const candidates = [
    html.match(/itemprop="name"\s+content="([^"]+)"/i)?.[1],
    html.match(/property="og:title"\s+content="([^"|]+)/i)?.[1],
    html.match(/<title>([^<|]+)/i)?.[1],
    html.match(/<h2>\s*([^<]+?)\s*<\/h2>/i)?.[1],
  ];
  const title = candidates.map((c) => textOf(c)).find((c) => /^(19[5-9]\d|20\d\d)\s+\S+\s+\S+/.test(c));
  const head = splitTitle(title);
  const values = labelledValues(html);
  const priceBlock = html.match(/class="price-container-content"[\s\S]{0,600}?class="amount">([^<]+)</i)?.[1];
  const engine = pick(values, 'engine');
  return [
    {
      // Stock numbers repeat across dealers, so the host is part of the id.
      id: `car-${new URL(url).hostname.replace(/^www\./, '').split('.')[0]}-${new URL(url).pathname.split('/').pop()}`,
      dealer: name,
      url,
      capturedAt,
      make: head.make,
      model: tidyName(head.model),
      variant: head.variant,
      year: head.year,
      odometerKm: kmOf(pick(values, 'odometer')),
      priceNzd: priceOf(textOf(priceBlock)),
      // Some dealers put fuel in the Engine row ("996cc, Petrol"); the government fuel-saver block always says "Motive Power: X".
      fuel: fuelOf(engine?.split(',').slice(1).join(',')) ?? fuelOf(html.match(/Motive Power:\s*([^<]+)</i)?.[1]),
      transmission: transmissionOf(pick(values, 'transmission')),
      body: bodyOf(pick(values, 'body')),
      engineCc: ccOf(engine),
      region,
    },
  ];
}
