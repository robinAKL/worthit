/**
 * Budget Car Sales. The stock list is JSON at /api/search (robots allows /api).
 * Each car is /vehicle?stockno=. Facts come from the labelled spans, not the description.
 */
import { bodyOf, ccOf, fuelOf, kmOf, priceOf, textOf, transmissionOf } from '../core/extract/specs.mjs';

const STOCK = /[?&]stockno=(\d+)/i;

export default {
  id: 'budget',
  name: 'Budget Car Sales',
  origin: 'https://www.budgetcarsales.co.nz',
  kind: 'vehicle',
  enabled: true,
  useSitemaps: false,
  listings: ['/api/search'],
  imagePermission: false,
  isDetailUrl: (url) => {
    const parsed = new URL(url);
    return parsed.pathname === '/vehicle' && STOCK.test(parsed.search);
  },
  linksFromListing: (body, origin) => {
    const text = String(body ?? '').trim();
    if (!text.startsWith('[')) return [];
    let rows;
    try {
      rows = JSON.parse(text);
    } catch {
      return [];
    }
    return rows
      .filter((row) => row && /^\d+$/.test(String(row.Stockno ?? '')))
      .map((row) => new URL(`/vehicle?stockno=${row.Stockno}`, origin).href);
  },
  extract: (html, { url, name, capturedAt }) => {
    const make = span(html, 'vehicle-make');
    const model = span(html, 'vehicle-model');
    const year = Number(iconValue(html, 'Year'));
    const priceNzd = priceOf(html.match(/class="price-new">([^<]+)/i)?.[1]);
    if (!make || !model || !year || !priceNzd) return [];
    const stock = new URL(url).searchParams.get('stockno') || span(html, 'vehicle-stockno');
    return [
      {
        id: `car-budget-${stock}`,
        dealer: name,
        url,
        capturedAt,
        make,
        model,
        variant: span(html, 'vehicle-variant'),
        year,
        odometerKm: kmOf(`${iconValue(html, 'Kilometers')} km`),
        priceNzd,
        fuel: fuelOf(iconValue(html, 'Fuel')),
        transmission: transmissionOf(iconValue(html, 'Transmission')),
        body: bodyOf(iconValue(html, 'Type')),
        engineCc: ccOf(`${span(html, 'vehicle-engine')} cc`),
      },
    ];
  },
};

function span(html, className) {
  const value = html.match(new RegExp(`class="${className}">([^<]+)`, 'i'))?.[1];
  return textOf(value) || undefined;
}

function iconValue(html, label) {
  const match = html.match(new RegExp(`>${label}</h3>\\s*<h5>([^<]+)`, 'i'));
  return textOf(match?.[1]);
}
