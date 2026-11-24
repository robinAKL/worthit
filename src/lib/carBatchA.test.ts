// Collector modules are plain JavaScript. This file checks behaviour, not their types.
// @ts-nocheck
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ajMotors from '../../scripts/collect/adapters/aj-motors.mjs';
import andrewSimms from '../../scripts/collect/adapters/andrew-simms.mjs';
import blackwells from '../../scripts/collect/adapters/blackwells.mjs';
import budget from '../../scripts/collect/adapters/budget.mjs';
import twoCheap from '../../scripts/collect/adapters/two-cheap-cars.mjs';
import { keepVehicleFacts } from '../../scripts/collect/core/facts.mjs';

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8');
const saved = (adapter, html: string, url: string) =>
  adapter.extract(html, { url, name: adapter.name, capturedAt: '2026-11-24T00:00:00.000Z' }).map((row) => keepVehicleFacts(row));

describe('car batch A', () => {
  it('reads Budget facts from the vehicle page and stock numbers from the search JSON', () => {
    const url = 'https://www.budgetcarsales.co.nz/vehicle?stockno=19077';
    const [row] = saved(budget, fixture('budget-detail.html'), url);
    expect(row).toMatchObject({
      id: 'car-budget-19077',
      make: 'Toyota',
      model: 'Prius',
      year: 2012,
      priceNzd: 11860,
      odometerKm: 100922,
      fuel: 'hybrid',
      transmission: 'automatic',
      body: 'hatchback',
      engineCc: 1797,
    });
    expect(row.imageUrl).toBeUndefined();
    const links = budget.linksFromListing('[{"Stockno":"19077","vinno":"SHOULD-NOT-LEAK"}]', budget.origin);
    expect(links).toEqual(['https://www.budgetcarsales.co.nz/vehicle?stockno=19077']);
    expect(JSON.stringify(links)).not.toContain('SHOULD-NOT-LEAK');
  });

  it('reads 2 Cheap Cars specs and marks a price that excludes ORC', () => {
    const url = 'https://www.2cheapcars.co.nz/car/124158/2014-mazda-cx-5';
    const [row] = saved(twoCheap, fixture('two-cheap-detail.html'), url);
    expect(row).toMatchObject({
      id: 'car-2cheap-124158',
      make: 'Mazda',
      model: 'CX-5',
      variant: '20S',
      year: 2014,
      priceNzd: 16989,
      orcIncluded: false,
      odometerKm: 33468,
      fuel: 'petrol',
      transmission: 'automatic',
      body: 'suv',
      engineCc: 1990,
    });
  });

  it('reads AJ Motors with the Motorcentral parser', () => {
    const url = 'https://www.ajmotors.co.nz/vehicle/2017-Toyota-Vitz/6867';
    const [row] = saved(ajMotors, fixture('motorcentral-detail.html'), url);
    expect(row).toMatchObject({ id: 'car-ajmotors-6867', make: 'Toyota', model: 'Vitz', year: 2017, priceNzd: 14995 });
    expect(row.imageUrl).toBeUndefined();
  });

  it('reads Andrew Simms from the title and JSON-LD, and does not keep a raw VIN', () => {
    const url = 'https://www.andrewsimms.co.nz/stock/details/3199776/2026-mitsubishi-pajero-sport';
    const [row] = saved(andrewSimms, fixture('andrew-simms-detail.html'), url);
    expect(row).toMatchObject({
      id: 'car-andrew-simms-3199776',
      make: 'Mitsubishi',
      model: 'Pajero Sport',
      year: 2026,
      priceNzd: 64990,
      orcIncluded: false,
      odometerKm: 10,
      fuel: 'diesel',
      transmission: 'automatic',
      engineCc: 2400,
    });
    expect(row.vin).toBeUndefined();
    expect(row.dedupeKey).toMatch(/^v-[0-9a-f]{16}$/);
    expect(JSON.stringify(row)).not.toContain('TESTVIN');
  });

  it('reads Blackwells columns and listing data-link urls', () => {
    const url = 'https://www.blackwells.co.nz/vehicle/byd/atto-3/999856509/';
    const [row] = saved(blackwells, fixture('blackwells-detail.html'), url);
    expect(row).toMatchObject({
      id: 'car-blackwells-999856509',
      make: 'BYD',
      model: 'Atto',
      variant: 'Extended',
      year: 2022,
      priceNzd: 36990,
      odometerKm: 41000,
      fuel: 'electric',
    });
    expect(row.engineCc).toBeUndefined();
    const links = blackwells.linksFromListing(fixture('blackwells-detail.html'), blackwells.origin);
    expect(links).toEqual([url]);
  });
});
