// Collector modules are plain JavaScript. This file checks behaviour, not their types.
// @ts-nocheck
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import autoCourt from '../../scripts/collect/adapters/auto-court.mjs';
import brendanFoot from '../../scripts/collect/adapters/brendan-foot.mjs';
import brianScott from '../../scripts/collect/adapters/brian-scott.mjs';
import cookeHowlison from '../../scripts/collect/adapters/cooke-howlison.mjs';
import croydons from '../../scripts/collect/adapters/croydons.mjs';
import { dedupeKey, keepVehicleFacts, vehicleProblems } from '../../scripts/collect/core/facts.mjs';
import { splitTitle } from '../../scripts/collect/core/extract/specs.mjs';

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8');
const ctx = (url: string, name: string) => ({ url, name, capturedAt: '2026-11-24T00:00:00.000Z' });
/** What the runner would save: extract, then the core whitelist. */
const saved = (adapter, html: string, url: string) => adapter.extract(html, ctx(url, adapter.name)).map((r) => keepVehicleFacts(r));

describe('Motorcentral dealers (Auto Court, Croydons, Brian Scott)', () => {
  const url = 'https://www.autocourt.net.nz/vehicle/2017-Toyota-Vitz/6867';

  it('reads title, price and the spec table', () => {
    const [row] = saved(autoCourt, fixture('motorcentral-detail.html'), url);
    expect(row).toEqual({
      id: 'car-autocourt-6867',
      dealer: 'Auto Court',
      url,
      capturedAt: '2026-11-24T00:00:00.000Z',
      make: 'Toyota',
      model: 'Vitz',
      variant: 'F',
      year: 2017,
      odometerKm: 19798,
      priceNzd: 14995,
      fuel: 'petrol',
      transmission: 'cvt',
      body: 'hatchback',
      engineCc: 996,
      region: 'Otago',
      source: 'feed',
    });
    expect(vehicleProblems(row)).toEqual([]);
  });

  it('finds detail links on a listing, drops the tracking query, and ignores other pages', () => {
    const links = croydons.linksFromListing(fixture('motorcentral-listing.html'), croydons.origin);
    expect(links).toHaveLength(5);
    expect(links.every((u) => /^https:\/\/www\.croydons\.co\.nz\/vehicle\/[^/?]+\/\d+$/.test(u))).toBe(true);
    expect(croydons.listings).toEqual(['/vehicles', '/vehicles?Page=2']);
    expect(brianScott.listings).toEqual(['/vehicles', '/vehicles?Page=2']);
  });

  it('returns nothing for a page that is not a Car page', () => {
    expect(autoCourt.extract('<html><title>Contact us</title></html>', ctx(url, 'Auto Court'))).toEqual([]);
  });
});

describe('Cooke Howlison (schema.org Car JSON-LD)', () => {
  it('reads used stock only and keeps the real page URL when JSON-LD names a staging host', () => {
    const url = 'https://www.cookehowlison.co.nz/stock/details/3796072/2019-bmw-x5-used';
    expect(cookeHowlison.isDetailUrl(url)).toBe(true);
    expect(cookeHowlison.isDetailUrl('https://www.cookehowlison.co.nz/stock/details/3498557/2026-bmw-m5-new')).toBe(false);
    const [row] = saved(cookeHowlison, fixture('cooke-howlison-detail.html'), url);
    expect(row).toMatchObject({ make: 'BMW', model: 'X5', variant: 'xDrive30d M-Sport', year: 2019, odometerKm: 66133, priceNzd: 64990, fuel: 'diesel', transmission: 'automatic', body: 'suv', region: 'Otago', url });
    expect(row.dedupeKey).toBe(dedupeKey('TESTVIN0000000001'));
    expect(JSON.stringify(row)).not.toMatch(/TESTVIN|staging|adtorque/);
  });
});

describe('Brendan Foot (spec table)', () => {
  const url = 'https://brendanfoot.co.nz/car/suzuki/swift-ABC123/';

  it('reads the Specifications table and maps the yard to a region', () => {
    const [row] = saved(brendanFoot, fixture('brendan-foot-detail.html'), url);
    expect(row).toMatchObject({ id: 'car-bfs-75390', make: 'Suzuki', model: 'Swift', variant: 'RSC Hybrid', year: 2025, odometerKm: 27476, priceNzd: 24995, fuel: 'hybrid', transmission: 'automatic', body: 'hatchback', region: 'Wellington' });
    expect(row.dedupeKey).toBe(dedupeKey('ABC123'));
    expect(row.plate).toBeUndefined();
    expect(row.engineCc).toBeUndefined(); // "60kW" is power, not displacement
  });

  it('collects used-stock detail links and nothing else', () => {
    const links = brendanFoot.linksFromListing(fixture('brendan-foot-listing.html'), brendanFoot.origin);
    expect(links).toHaveLength(3);
    expect(links.every((u) => brendanFoot.isDetailUrl(u))).toBe(true);
  });
});

describe('title parsing', () => {
  it('splits year, make, model and variant, including two-word makes', () => {
    expect(splitTitle('2017 Toyota Vitz F')).toEqual({ year: 2017, make: 'Toyota', model: 'Vitz', variant: 'F' });
    expect(splitTitle('2015 Land Rover Discovery Sport HSE')).toEqual({ year: 2015, make: 'Land Rover', model: 'Discovery', variant: 'Sport HSE' });
  });
});

describe('MotorCo (Car JSON-LD plus a label panel)', () => {
  it('fills model, variant, odometer and transmission from the label panel', async () => {
    const { default: motorco } = await import('../../scripts/collect/adapters/motorco.mjs');
    const url = 'https://motorco.co.nz/inventory/mitsubishi-outlander-stock-34522/';
    const [row] = saved(motorco, fixture('motorco-detail.html'), url);
    expect(row).toMatchObject({ make: 'Mitsubishi', model: 'Outlander', variant: '7 Seater / 20 G', year: 2011, odometerKm: 71700, priceNzd: 15500, fuel: 'petrol', transmission: 'automatic', body: 'suv', engineCc: 2000, region: 'Auckland', url });
    expect(row.dedupeKey).toBe(dedupeKey('TESTVIN0000000002'));
    const links = motorco.linksFromListing(fixture('motorco-listing.html'), motorco.origin);
    expect(links).toHaveLength(3);
    expect(links.every((u) => motorco.isDetailUrl(u))).toBe(true);
  });
});

describe('Motorcentral fuel fallback', () => {
  it('reads fuel from the fuel-saver block when the Engine row has none', async () => {
    const html = fixture('motorcentral-detail.html').replace('996cc, Petrol', '996cc') + '<div>Motive Power: Diesel </div>';
    const [row] = autoCourt.extract(html, ctx('https://www.autocourt.net.nz/vehicle/2017-Toyota-Vitz/6867', 'Auto Court'));
    expect(row.fuel).toBe('diesel');
    expect(row.engineCc).toBe(996);
  });
});

describe('dealers we do not collect', () => {
  it('are registered as disabled with a reason, so the runner makes no request', async () => {
    const { ADAPTERS } = await import('../../scripts/collect/adapters/index.mjs');
    const off = Object.fromEntries(ADAPTERS.filter((a) => !a.enabled).map((a) => [a.id, a.disabledReason]));
    expect(Object.keys(off).sort()).toEqual(['cari-cars', 'dave-allen', 'four-guys', 'nzc']);
    expect(off['cari-cars']).toMatch(/robots/);
    for (const reason of Object.values(off)) expect(String(reason).length).toBeGreaterThan(20);
  });
});

describe('GVI (Motorcentral with an empty title and name)', () => {
  it('takes the vehicle name from og:title or the heading, and the fuel from the fuel-saver block', async () => {
    const { default: gvi } = await import('../../scripts/collect/adapters/gvi.mjs');
    const url = 'https://www.gvi.kiwi/vehicle/2016-Toyota-Mirai/50617';
    const [row] = saved(gvi, fixture('motorcentral-gvi-detail.html'), url);
    expect(row).toMatchObject({ id: 'car-gvi-50617', make: 'Toyota', model: 'Mirai', year: 2016, odometerKm: 52234, priceNzd: 19880, fuel: 'electric', transmission: 'automatic', body: 'sedan' });
    expect(row.region).toBeUndefined(); // the page names more than one city, so we do not guess
  });
});
