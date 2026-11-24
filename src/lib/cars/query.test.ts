import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { allVehicles } from './index';
import { querySelectsCars, vehiclesForQuery } from './query';

const aqua = {
  id: 'a',
  source: 'feed',
  dealer: 'D',
  url: 'https://example.com/a',
  capturedAt: '2026-01-01T00:00:00.000Z',
  make: 'Toyota',
  model: 'Aqua',
  year: 2014,
  priceNzd: 9000,
} satisfies Vehicle;

const hilux = { ...aqua, id: 'h', model: 'Hilux', priceNzd: 40000 };

describe('vehiclesForQuery', () => {
  it('keeps a make and model, and a car budget, off the product list', () => {
    expect(vehiclesForQuery('Toyota Aqua', [aqua, hilux])?.map((car) => car.id)).toEqual(['a']);
    expect(vehiclesForQuery('car under $15000', [aqua, hilux])?.map((car) => car.id)).toEqual(['a']);
    expect(vehiclesForQuery('二手车 2万以内', [aqua, hilux])?.map((car) => car.id)).toEqual(['a']);
    expect(vehiclesForQuery('laptop under $1500', [aqua, hilux])).toBeNull();
    expect(querySelectsCars('fridge', [aqua, hilux])).toBe(false);
  });

  it('finds collected Aquas and cars under the stated budget', () => {
    const fleet = allVehicles();
    const aquas = vehiclesForQuery('Toyota Aqua', fleet);
    expect(aquas).not.toBeNull();
    expect(aquas!.length).toBeGreaterThan(0);
    expect(aquas!.every((car) => car.make === 'Toyota' && car.model === 'Aqua')).toBe(true);
    const cheap = vehiclesForQuery('car under $15000', fleet);
    expect(cheap!.length).toBeGreaterThan(0);
    expect(cheap!.length).toBeLessThan(fleet.length);
    expect(cheap!.every((car) => car.priceNzd <= 15000)).toBe(true);
  });
});
