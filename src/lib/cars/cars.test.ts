import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { allCarPicks, allVehicles, carResults, isRough, CHEAP_MAX_KM, CHEAP_MIN_YEAR, comparableSet, conditionScore, MAX_OVER_FAIR, dedupe, fitModel, rankCars, toCar, type Car } from './index';
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

  it('leaves a car far below its estimate out of the value lane, but still lists it by price', () => {
    const cars = fleet();
    const odd = cars.find((c) => c.make === 'Honda' && c.year === 2021)!;
    odd.priceNzd = Math.round(odd.priceNzd * 0.4);
    expect(rankCars(cars, 'value', 2026).some((p) => p.car.id === odd.id)).toBe(false);
    expect(rankCars(cars, 'cheap', 2026).some((p) => p.car.id === odd.id)).toBe(true);
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

  it('keeps brand-new stock out of the used-car ranking', () => {
    const base = fleet()[0];
    expect(toCar({ ...base, url: 'https://dealer.example/stock/details/1/2026-mitsubishi-pajero-sport-new' }, 2026)).toBeNull();
    expect(toCar({ ...base, year: 2026, odometerKm: 25 }, 2026)).toBeNull();
    expect(toCar({ ...base, url: 'https://dealer.example/car/2/2015-subaru-outback-new-shape-rv-suv' }, 2026)).not.toBeNull();
    expect(toCar({ ...base, year: 2026, odometerKm: 8_100 }, 2026)).not.toBeNull();
  });

  it('loads the collected dealer feeds bundled with the app', () => {
    expect(allVehicles().length).toBeGreaterThan(100);
    const r = carResults('value');
    expect(r.valued).toBeGreaterThan(100);
    expect(r.dealers).toBeGreaterThanOrEqual(5);
  });
});

describe('comparison rules v2 (T-38)', () => {
  const at = (over: Partial<Vehicle>, i: number): Vehicle => ({
    id: `x${i}`,
    source: 'feed',
    dealer: 'D',
    url: `https://dealer.example/x/${i}`,
    capturedAt: '2026-11-24T00:00:00.000Z',
    make: 'Toyota',
    model: 'Aqua',
    year: 2016,
    odometerKm: 80_000,
    priceNzd: 12_000,
    fuel: 'hybrid',
    body: 'hatchback',
    ...over,
  });

  it('compares with the closest set first: same model, two years, same fuel', () => {
    const cars = fleet().map((v) => toCar(v, 2026)) as Car[];
    const aqua = cars.find((c) => c.model === 'Aqua' && c.year === 2020)!;
    const set = comparableSet(aqua, cars);
    expect(set.basis).toBe('model-near');
    expect(set.peers.every((p) => p.modelKey === aqua.modelKey && Math.abs(p.year - aqua.year) <= 2 && p.fuelClass === aqua.fuelClass)).toBe(true);
    expect(set.peers.some((p) => p.id === aqua.id)).toBe(false);
  });

  it('widens step by step, and says so', () => {
    const one = toCar(at({ id: 'solo', make: 'Rare', model: 'One' }, 0), 2026)!;
    expect(comparableSet(one, [one]).basis).toBe('pooled');
    const few = [0, 1, 2].map((i) => toCar(at({ make: 'Bmw', model: '120i', year: 2010 + i }, i), 2026)!);
    expect(comparableSet(few[0], few).basis).toBe('model-few');
  });

  it('gives one consistent answer: the rank and the fair price come from the same adjusted prices', () => {
    for (const pick of allCarPicks()) {
      if (pick.cohort.kind === 'none') continue;
      const { prices, rank } = pick.cohort;
      // Under the fair price means in the cheaper half of the adjusted prices, and over means the dearer half.
      if (pick.valuation.gap < -0.02) expect(rank).toBeLessThanOrEqual(Math.ceil(prices.length / 2));
      if (pick.valuation.gap > 0.02) expect(rank).toBeGreaterThan(Math.floor(prices.length / 2));
    }
  });

  it('keeps premium brands within 8% of their fair price at every age, on the live data', () => {
    const picks = allCarPicks().filter((p) => p.car.premium);
    for (const [lo, hi] of [[0, 5], [6, 10], [11, 99]]) {
      const gaps = picks.filter((p) => 2026 - p.car.year >= lo && 2026 - p.car.year <= hi).map((p) => p.valuation.gap).sort((a, b) => a - b);
      if (gaps.length < 5) continue;
      expect(Math.abs(gaps[Math.floor(gaps.length / 2)])).toBeLessThan(0.08);
    }
  });

  it('makes no value claim from too few cars: such cars are listed after every car we can judge', () => {
    const picks = carResults('value').picks;
    const rough = (b: Parameters<typeof isRough>[0]) => isRough(b);
    const firstRough = picks.findIndex((p) => rough(p.valuation.basis));
    expect(firstRough).toBeGreaterThan(0);
    expect(picks.slice(firstRough).every((p) => rough(p.valuation.basis))).toBe(true);
  });

  it('reads an odometer equal to the model year as unknown, not 2,021 km', () => {
    expect(toCar(at({ year: 2021, odometerKm: 2021 }, 9), 2026)!.odometerKm).toBeUndefined();
    expect(toCar(at({ year: 2021, odometerKm: 2022 }, 9), 2026)!.odometerKm).toBe(2022);
  });
});

describe('car search (T-38)', () => {
  it('reads digits inside a model name as part of the name, not a budget', async () => {
    const { parseQuery } = await import('../parseQuery');
    expect(parseQuery('BMW 120i')).toMatchObject({ keywords: ['bmw', '120i'] });
    expect(parseQuery('BMW 120i').budgetMax).toBeUndefined();
    expect(parseQuery('Mazda CX-5').budgetMax).toBeUndefined();
    expect(parseQuery('Toyota Aqua under 10000').budgetMax).toBe(10000);
    expect(parseQuery('1500nzd phone').budgetMax).toBe(1500);
  });

  it('values searched cars against the whole fleet, not only the matches', async () => {
    const { vehiclesForQuery } = await import('./query');
    const fleet = vehiclesForQuery('Toyota Aqua', allVehicles())!;
    const searched = carResults('value', fleet).picks;
    const everywhere = new Map(allCarPicks().map((p) => [p.car.id, p.valuation.expected]));
    expect(searched.length).toBeGreaterThan(0);
    for (const p of searched) expect(p.valuation.expected).toBe(everywhere.get(p.car.id));
  });
});

describe('lanes v3 (T-42): "lower price" is not the worst, "good condition" is not just dear', () => {
  it('Lower price lists only cars that pass the floor, cheapest first, ranked among those', () => {
    const picks = carResults('cheap').picks;
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) {
      expect(p.car.year).toBeGreaterThanOrEqual(CHEAP_MIN_YEAR);
      expect(p.car.odometerKm ?? Infinity).toBeLessThanOrEqual(CHEAP_MAX_KM);
      expect(p.valuation.gap).toBeLessThanOrEqual(MAX_OVER_FAIR);
      expect(p.valuation.basis).not.toBe('pooled');
    }
    expect(picks.map((p) => p.car.priceNzd)).toEqual([...picks.map((p) => p.car.priceNzd)].sort((a, b) => a - b));
    expect(picks.map((p) => p.priceRank)).toEqual(picks.map((_, i) => i + 1));
    expect(picks.every((p) => p.valued === picks.length)).toBe(true);
  });

  it('Good condition keeps the top third of each body type and nothing overpriced', () => {
    const all = allCarPicks();
    const picks = carResults('refined').picks;
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.length).toBeLessThan(all.length / 2);
    for (const p of picks) {
      expect(p.valuation.gap).toBeLessThanOrEqual(MAX_OVER_FAIR);
      const sameBody = all.filter((x) => x.car.bodyClass === p.car.bodyClass).map((x) => conditionScore(x.car, 2026));
      const better = sameBody.filter((s) => s > conditionScore(p.car, 2026)).length;
      expect(better).toBeLessThan(Math.ceil(sameBody.length / 3));
    }
  });
});
