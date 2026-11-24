// Collector modules are plain JavaScript. This file checks behaviour, not their types.
// @ts-nocheck
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ADAPTERS } from '../../scripts/collect/adapters/index.mjs';
import template from '../../scripts/collect/adapters/_template.mjs';
import { vehiclesFromHtml } from '../../scripts/collect/core/extract/jsonld.mjs';
import { dedupeKey, keepVehicleFacts, vehicleProblems } from '../../scripts/collect/core/facts.mjs';
import { checkAdapter, runAdapter } from '../../scripts/collect/core/runner.mjs';
import { createSession } from '../../scripts/collect/core/session.mjs';

const ORIGIN = 'https://cars.example';
const ROBOTS = `User-agent: *\nDisallow: /private/\nSitemap: ${ORIGIN}/sitemap.xml\n`;

function car(id: number, extra = {}) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `2019 Toyota Aqua ${id}`,
    brand: { '@type': 'Brand', name: 'Toyota' },
    model: 'Aqua',
    vehicleModelDate: '2019',
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: '42,000', unitCode: 'KMT' },
    fuelType: 'Petrol Hybrid',
    vehicleTransmission: 'Automatic',
    bodyType: 'Hatchback',
    vehicleEngine: { '@type': 'EngineSpecification', engineDisplacement: { value: '1.5', unitCode: 'LTR' } },
    vehicleIdentificationNumber: 'NHP10-1234567',
    description: 'Dealer marketing copy that must not be stored.',
    image: ['https://cars.example/img/1.jpg'],
    seller: { '@type': 'Person', name: 'Private Name', telephone: '021 000 000' },
    offers: { '@type': 'Offer', price: '15990', priceCurrency: 'NZD' },
    ...extra,
  });
}
const page = (json) => `<html><head><script type="application/ld+json">${json}</script></head><body>x</body></html>`;

/** A fake site. `pages` maps path to [status, body]. Records every URL requested. */
function fakeSite(pages: Record<string, [number, string]>) {
  const requested: string[] = [];
  const fetchImpl = async (url: string) => {
    requested.push(url);
    const path = new URL(url).pathname + new URL(url).search;
    const [status, body] = pages[path] ?? [404, 'not found'];
    return { status, body, url };
  };
  return { fetchImpl, requested };
}

function clock() {
  let t = 1_000_000;
  const gaps: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      gaps.push(ms);
      t += ms;
    },
    gaps,
  };
}

const sitemap = (paths: string[]) => `<urlset>${paths.map((p) => `<url><loc>${ORIGIN}${p}</loc></url>`).join('')}</urlset>`;

const carAdapter = {
  id: 'example-cars',
  name: 'Example Cars',
  origin: ORIGIN,
  kind: 'vehicle',
  enabled: true,
  isDetailUrl: (url) => /\/(vehicle|private)\/\d+/.test(url) || url.startsWith('https://elsewhere'),
};

describe('collector core: an adapter cannot get around the rules', () => {
  it('reads robots first and never requests a disallowed or off-site URL, even if the adapter lists it', async () => {
    const { fetchImpl, requested } = fakeSite({
      '/robots.txt': [200, ROBOTS],
      '/sitemap.xml': [200, sitemap(['/vehicle/1', '/private/2', '/vehicle/3'])],
      '/vehicle/1': [200, page(car(1))],
      '/vehicle/3': [200, page(car(3))],
    });
    const adapter = { ...carAdapter, sitemaps: ['/sitemap.xml', 'https://elsewhere.example/sitemap.xml'] };
    const c = clock();
    const out = await runAdapter({ adapter, limit: 10, userAgent: 'WorthItBot/0.1 (+test)', fetchImpl, now: c.now, sleep: c.sleep, capturedAt: 'T' });
    expect(requested[0]).toBe(`${ORIGIN}/robots.txt`);
    expect(requested.some((u) => u.includes('/private/'))).toBe(false);
    expect(requested.some((u) => u.startsWith('https://elsewhere'))).toBe(false);
    expect(out.rows.map((r) => r.url)).toEqual([`${ORIGIN}/vehicle/1`, `${ORIGIN}/vehicle/3`]);
    expect(out.skipped).toBeGreaterThanOrEqual(1);
  });

  it('waits at least two seconds between requests to one site', async () => {
    const { fetchImpl } = fakeSite({
      '/robots.txt': [200, ROBOTS],
      '/sitemap.xml': [200, sitemap(['/vehicle/1', '/vehicle/2'])],
      '/vehicle/1': [200, page(car(1))],
      '/vehicle/2': [200, page(car(2))],
    });
    const c = clock();
    await runAdapter({ adapter: carAdapter, limit: 10, userAgent: 'u', fetchImpl, now: c.now, sleep: c.sleep, capturedAt: 'T' });
    expect(c.gaps.length).toBe(3);
    expect(c.gaps.every((g) => g >= 2000)).toBe(true);
  });

  it('refuses a pace below two seconds and refuses a second request in flight', async () => {
    expect(() => createSession({ origin: ORIGIN, userAgent: 'u', fetchImpl: async () => ({}), minIntervalMs: 500 })).toThrow(/floor/);
    let release;
    const fetchImpl = (url) =>
      url.endsWith('robots.txt') ? Promise.resolve({ status: 200, body: ROBOTS, url }) : new Promise((r) => (release = () => r({ status: 200, body: '', url })));
    const session = createSession({ origin: ORIGIN, userAgent: 'u', fetchImpl, now: () => 0, sleep: async () => {} });
    await session.loadRobots();
    const first = session.get(`${ORIGIN}/vehicle/1`);
    await Promise.resolve();
    await expect(session.get(`${ORIGIN}/vehicle/2`)).rejects.toThrow(/concurrency 1/);
    release();
    await first;
  });

  it('stops the whole site on 403, 429, or a challenge page and makes no further request', async () => {
    for (const [status, body] of [
      [403, 'forbidden'],
      [429, 'slow down'],
      [200, '<div class="cf-turnstile"></div>'],
    ] as const) {
      const { fetchImpl, requested } = fakeSite({
        '/robots.txt': [200, ROBOTS],
        '/sitemap.xml': [200, sitemap(['/vehicle/1', '/vehicle/2', '/vehicle/3'])],
        '/vehicle/1': [status, body],
        '/vehicle/2': [200, page(car(2))],
        '/vehicle/3': [200, page(car(3))],
      });
      const c = clock();
      const out = await runAdapter({ adapter: carAdapter, limit: 10, userAgent: 'u', fetchImpl, now: c.now, sleep: c.sleep, capturedAt: 'T' });
      expect(out.stopped).not.toBe('');
      expect(requested.at(-1)).toBe(`${ORIGIN}/vehicle/1`);
      expect(out.rows).toEqual([]);
    }
  });

  it('does not run at all when robots.txt fails, or when the adapter is disabled', async () => {
    const { fetchImpl, requested } = fakeSite({ '/robots.txt': [500, 'boom'] });
    const out = await runAdapter({ adapter: carAdapter, limit: 5, userAgent: 'u', fetchImpl, now: () => 0, sleep: async () => {} });
    expect(requested).toEqual([`${ORIGIN}/robots.txt`]);
    expect(out.stopped).toBe('robots HTTP 500');

    const off = fakeSite({});
    const disabled = await runAdapter({ adapter: { ...carAdapter, enabled: false, disabledReason: 'robots blocks /vehicle/' }, limit: 5, userAgent: 'u', fetchImpl: off.fetchImpl });
    expect(off.requested).toEqual([]);
    expect(disabled.stopped).toMatch(/disabled/);
  });

  it('keeps only whitelisted vehicle facts, whatever extract returns', async () => {
    const { fetchImpl } = fakeSite({
      '/robots.txt': [200, ROBOTS],
      '/sitemap.xml': [200, sitemap(['/vehicle/1'])],
      '/vehicle/1': [200, page(car(1))],
    });
    const greedy = {
      ...carAdapter,
      extract: (html, ctx) =>
        vehiclesFromHtml(html, ctx.url, ctx.name, ctx.capturedAt).map((r) => ({
          ...r,
          description: 'copied text',
          sellerPhone: '021 000 000',
          imageUrl: 'https://cars.example/img/1.jpg',
        })),
    };
    const c = clock();
    const out = await runAdapter({ adapter: greedy, limit: 5, userAgent: 'u', fetchImpl, now: c.now, sleep: c.sleep, capturedAt: 'T' });
    const row = out.rows[0];
    expect(row).toMatchObject({ make: 'Toyota', model: 'Aqua', year: 2019, odometerKm: 42000, priceNzd: 15990, fuel: 'hybrid', transmission: 'automatic', body: 'hatchback', engineCc: 1500, source: 'feed' });
    expect(row.description).toBeUndefined();
    expect(row.sellerPhone).toBeUndefined();
    expect(row.imageUrl).toBeUndefined();
    expect(row.vin).toBeUndefined();
    expect(row.dedupeKey).toBe(dedupeKey('NHP10-1234567'));
    expect(JSON.stringify(row)).not.toMatch(/NHP10-1234567|Private Name|marketing/);
  });

  it('skips rows that are missing a make, model, year, or price', async () => {
    expect(vehicleProblems({ make: 'Toyota', model: 'Aqua', year: 2019, priceNzd: 1, url: 'https://x' })).toEqual([]);
    expect(vehicleProblems({ model: 'Aqua', year: 1800, priceNzd: 0, url: 'http://x' })).toEqual(['make', 'year', 'priceNzd', 'url']);
    expect(keepVehicleFacts({ make: 'A', imageUrl: 'https://i' }, { imagePermission: true }).imageUrl).toBe('https://i');
  });

  it('caps a run at the requested limit and at 200', async () => {
    const paths = Array.from({ length: 6 }, (_, i) => `/vehicle/${i + 1}`);
    const pages = Object.fromEntries(paths.map((p, i) => [p, [200, page(car(i + 1))]]));
    const { fetchImpl } = fakeSite({ '/robots.txt': [200, ROBOTS], '/sitemap.xml': [200, sitemap(paths)], ...pages });
    const c = clock();
    const out = await runAdapter({ adapter: carAdapter, limit: 2, userAgent: 'u', fetchImpl, now: c.now, sleep: c.sleep, capturedAt: 'T' });
    expect(out.rows).toHaveLength(2);
  });
});

describe('robots.txt quirks seen on NZ dealer sites', () => {
  it('reads a file that starts with a byte-order mark and uses CRLF', async () => {
    const { parseRobots, isAllowed } = await import('../../scripts/collect/core/robots.mjs');
    const robots = parseRobots('﻿User-agent: *\r\nDisallow: /Motorcentral/\r\nDisallow: /BuyNow\r\n');
    expect(robots.rules).toHaveLength(2);
    expect(isAllowed('https://dealer.example/Motorcentral/x', robots)).toBe(false);
    expect(isAllowed('https://dealer.example/BuyNow.aspx', robots)).toBe(false);
    expect(isAllowed('https://dealer.example/used-cars/toyota/1', robots)).toBe(true);
  });

  it('applies rules written before any User-agent line to everyone', async () => {
    const { parseRobots, isAllowed } = await import('../../scripts/collect/core/robots.mjs');
    const robots = parseRobots('Disallow: /stock/\n\nUser-agent: Googlebot\nAllow: /\n');
    expect(isAllowed('https://dealer.example/stock/1', robots)).toBe(false);
  });
});

describe('adapters', () => {
  it('rejects an adapter that tries to set network behaviour or omits required fields', () => {
    expect(() => checkAdapter({ ...carAdapter, userAgent: 'Mozilla/5.0' })).toThrow(/set by the core/);
    expect(() => checkAdapter({ ...carAdapter, fetch: () => {} })).toThrow(/set by the core/);
    expect(() => checkAdapter({ ...carAdapter, origin: 'http://cars.example' })).toThrow(/https/);
    expect(() => checkAdapter({ ...carAdapter, enabled: false })).toThrow(/disabledReason/);
    expect(() => checkAdapter({ ...carAdapter, kind: 'house' })).toThrow(/kind/);
  });

  it('every registered adapter and the template pass the check, ids are unique, and each file is registered', () => {
    for (const adapter of [...ADAPTERS, template]) expect(() => checkAdapter(adapter)).not.toThrow();
    const ids = ADAPTERS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const files = readdirSync(new URL('../../scripts/collect/adapters/', import.meta.url))
      .filter((f) => f.endsWith('.mjs') && !f.startsWith('_') && f !== 'index.mjs')
      .map((f) => f.replace(/\.mjs$/, ''));
    expect(files.sort()).toEqual([...ids].sort());
  });
});
