import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { allVehicles, carResults, dedupe, fitModel, rankCars, toCar, type Car } from './index';
import { carReason } from './reason';

/** Synthetic fleet: four makes, ages 1..12, km rising with age, Toyota Aqua as a same-model group. */
function fleet(): Vehicle[] {
  const out: Vehicle[] = [];
  const makes: [string, string, number][] = [
    ['Toyota', 'Aqua', 1],
    ['Mazda', 'Axela', 0.95],
    ['Nissan', 'Note', 0.85],
    ['Honda', 'Fit', 0.9],
  ];
  let n = 0;
  for (const [make, model, level] of makes) {
    for (let age = 1; age <= 12; age++) {
      const km = age * 14_000 + (n % 3) * 5_000;
      const price = Math.round(level * 32_000 * Math.exp(-0.11 * age - 0.012 * (km / 10_000)));
      out.push({
        id: `c${n}`,
        source: 'feed',
        dealer: n % 2 ? 'Dealer A' : 'Dealer B',
        url: `https://dealer.example/car/${n}`,
        capturedAt: '2026-11-24T00:00:00.000Z',
        make,
        model,
        year: 2026 - age,
        odometerKm: km,
        priceNzd: price,
        fuel: make === 'Toyota' ? 'hybrid' : 'petrol',
        body: 'hatchback',
      });
      n++;
    }
  }
  return out;
}

describe('used-car valuation', () => {
  it('drops exact duplicates across dealers, keeping the cheaper listing', () => {
    const base = fleet()[0];
    const cars = [
      { ...base, id: 'a', dealer: 'A', priceNzd: 20_000, dedupeKey: 'v-1' },
      { ...base, id: 'b', dealer: 'B', priceNzd: 19_500, dedupeKey: 'v-1' },
      { ...base, id: 'c', dealer: 'C', priceNzd: 19_000 },
      { ...base, id: 'd', dealer: 'D', priceNzd: 19_900 },
    ].map(toCar) as Car[];
    const kept = dedupe(cars);
    expect(kept.map((c) => c.id).sort()).toEqual(['b', 'c']);
  });

  it('never values a car higher for having more kilometres', () => {
    const cars = fleet().map(toCar) as Car[];
    const model = fitModel(cars, 2026);
    const car = cars[20];
    const low = model.predictLog({ ...car, odometerKm: 40_000 });
    const high = model.predictLog({ ...car, odometerKm: 140_000 });
    expect(high).toBeLessThanOrEqual(low);
  });

  it('puts an underpriced car first in the value lane and says by how much', () => {
    const cars = fleet();
    const target = cars.find((c) => c.make === 'Mazda' && c.year === 2020)!;
    target.priceNzd = Math.round(target.priceNzd * 0.7);
    const [top] = rankCars(cars, 'value', 2026);
    expect(top.car.id).toBe(target.id);
    expect(top.valuation.gap).toBeLessThan(-0.2);
    const en = carReason(top, 'en');
    const zh = carReason(top, 'zh-Hans');
    expect(en).toContain(`$${target.priceNzd.toLocaleString('en-NZ')}`);
    expect(en).toContain(`$${top.valuation.expected.toLocaleString('en-NZ')}`);
    expect(en).toMatch(/\d+% below/);
    expect(zh).toMatch(/低 \d+%/);
  });

  it('keeps the cheap lane to sensible cars and the refined lane to newer, lower-kilometre ones', () => {
    const cars = fleet();
    cars.push({ ...cars[0], id: 'tired', year: 2004, odometerKm: 310_000, priceNzd: 2_000 });
    const cheap = rankCars(cars, 'cheap', 2026);
    expect(cheap.some((p) => p.car.id === 'tired')).toBe(false);
    expect(cheap[0].car.priceNzd).toBe(Math.min(...cheap.map((p) => p.car.priceNzd)));
    const refined = rankCars(cars, 'refined', 2026);
    expect(refined[0].car.year).toBe(2025);
  });

  it('never cites a field the dealer did not state', () => {
    const cars = fleet().map((c) => ({ ...c, fuel: undefined }));
    for (const lane of ['value', 'cheap', 'refined'] as const) {
      for (const pick of rankCars(cars, lane, 2026).slice(0, 5)) {
        for (const locale of ['en', 'zh-Hans'] as const) {
          const text = carReason(pick, locale);
          expect(text).not.toMatch(/hybrid|electric|混动|纯电|undefined|NaN|\b0 km\b/);
        }
      }
    }
  });

  it('skips motorbikes and cars without year or price', () => {
    const base = fleet()[0];
    expect(toCar({ ...base, body: 'Motorbike' })).toBeNull();
    expect(toCar({ ...base, priceNzd: 0 })).toBeNull();
    expect(toCar({ ...base, year: Number.NaN })).toBeNull();
    expect(toCar({ ...base, make: 'Mercedes', model: 'Benz', variant: 'C200 Avantgarde' })).toMatchObject({ make: 'Mercedes-Benz', model: 'C200', variant: 'Avantgarde', premium: true });
  });

  it('loads the collected dealer feeds bundled with the app', () => {
    expect(allVehicles().length).toBeGreaterThan(100);
    const r = carResults('value');
    expect(r.valued).toBeGreaterThan(100);
    expect(r.dealers).toBeGreaterThanOrEqual(5);
  });
});
