/**
 * MotorCo, Penrose, Auckland. WordPress inventory: /inventory/ lists 12 cars a page,
 * detail pages carry a Car JSON-LD (make, year, price, body, engine, VIN) and a
 * label/value panel (model variant, odometer, transmission). The robots sitemap URL 404s.
 */
import { vehiclesFromHtml } from '../core/extract/jsonld.mjs';
import { hrefsFromHtml } from '../core/discover.mjs';
import { kmOf, labelledValues, pick, transmissionOf } from '../core/extract/specs.mjs';

const DETAIL = /^\/inventory\/[a-z0-9-]+-stock-\d+\/?$/i;

export default {
  id: 'motorco',
  name: 'MotorCo',
  origin: 'https://motorco.co.nz',
  kind: 'vehicle',
  enabled: true,
  useSitemaps: false,
  listings: ['/inventory/', '/inventory/page/2/', '/inventory/page/3/'],
  isDetailUrl: (url) => DETAIL.test(new URL(url).pathname),
  linksFromListing: (html, origin) => hrefsFromHtml(html, origin, (url) => DETAIL.test(new URL(url).pathname)),
  extract: (html, { url, name, capturedAt }) => {
    const values = labelledValues(html);
    return vehiclesFromHtml(html, url, name, capturedAt).map((row) => {
      // JSON-LD name is "<Make> <Model> stock #<n>" and has no model field.
      const title = html.match(/"@type"\s*:\s*"Car"[\s\S]{0,200}?"name"\s*:\s*"([^"]+)"/)?.[1] ?? '';
      let rest = title.replace(/\s*stock\s*#\s*\d+\s*$/i, '').trim();
      if (row.make && rest.toLowerCase().startsWith(`${row.make.toLowerCase()} `)) rest = rest.slice(row.make.length).trim();
      const model = row.model || rest.split(' ')[0] || undefined;
      return {
        ...row,
        model,
        variant: row.variant ?? pick(values, 'variant'),
        odometerKm: row.odometerKm ?? kmOf(pick(values, 'odometer')),
        transmission: row.transmission ?? transmissionOf(pick(values, 'transmission')),
        region: 'Auckland',
      };
    });
  },
};
