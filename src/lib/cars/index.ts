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

export function carResults(lane: Lane, vehicles: Vehicle[] = allVehicles(), nowYear?: number): CarResult {
  const picks = rankCars(vehicles, lane, nowYear);
  // The refined lane keeps every valued car, so it gives the full count and dealer list.
  const all = lane === 'refined' ? picks : rankCars(vehicles, 'refined', nowYear);
  return {
    picks,
    valued: all[0]?.valued ?? 0,
    dealers: new Set(all.map((p) => p.car.dealer)).size,
    capturedAt: vehicles.map((v) => v.capturedAt).sort().at(-1),
  };
}
