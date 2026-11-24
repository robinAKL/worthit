import type { Lane, Vehicle } from '../types';
import { rankCars, type CarPick } from './model';

export * from './model';

/** Every collected dealer feed under src/data/feeds/cars, bundled at build time. */
const feeds = import.meta.glob<{ vehicles: Vehicle[] }>('../../data/feeds/cars/*.json', { eager: true, import: 'default' });

export function allVehicles(): Vehicle[] {
  return Object.values(feeds).flatMap((feed) => feed.vehicles ?? []);
}

export interface CarResult {
  picks: CarPick[];
  /** Cars that could be valued after de-duplication. */
  valued: number;
  dealers: number;
  /** Latest capture time across the feeds. */
  capturedAt?: string;
}

/**
 * Ranked cars for one lane. `vehicles` narrows the list (a search); every car is still valued
 * against the whole fleet, so a search for one model never re-fits the price model on that model alone.
 */
export function carResults(lane: Lane, vehicles?: Vehicle[], nowYear?: number): CarResult {
  const universe = allVehicles();
  const only = vehicles && vehicles !== universe ? new Set(vehicles.map((v) => v.id)) : null;
  const keep = (p: CarPick) => !only || only.has(p.car.id);
  const picks = rankCars(universe, lane, nowYear).filter(keep);
  // The refined lane keeps every valued car, so it gives the full count and dealer list.
  const all = lane === 'refined' ? picks : rankCars(universe, 'refined', nowYear).filter(keep);
  return {
    picks,
    valued: only ? all.length : (all[0]?.valued ?? 0),
    dealers: new Set(all.map((p) => p.car.dealer)).size,
    capturedAt: (vehicles ?? universe).map((v) => v.capturedAt).sort().at(-1),
  };
}
