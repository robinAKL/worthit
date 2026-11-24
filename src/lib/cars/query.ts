import { parseQuery } from '../parseQuery';
import type { Vehicle } from '../types';

function makeModel(car: Vehicle): { make: string; model: string } {
  return { make: car.make.toLowerCase(), model: car.model.toLowerCase() };
}

/** True when this search should filter the used-car list instead of the product list. */
export function querySelectsCars(raw: string, vehicles: Vehicle[]): boolean {
  const parsed = parseQuery(raw);
  if (!raw.trim() || parsed.category) return false;
  if (parsed.kind === 'car') return true;
  return parsed.keywords.some((word) =>
    vehicles.some((car) => {
      const { make, model } = makeModel(car);
      return make === word || model === word;
    }),
  );
}

/**
 * Cars for a vehicle search. `null` means the query is not about cars, so the
 * full list stays as it is.
 */
export function vehiclesForQuery(raw: string, vehicles: Vehicle[]): Vehicle[] | null {
  if (!querySelectsCars(raw, vehicles)) return null;
  const parsed = parseQuery(raw);
  const keys = parsed.keywords.filter((word) =>
    vehicles.some((car) => {
      const { make, model } = makeModel(car);
      return make === word || model === word;
    }),
  );
  return vehicles.filter((car) => {
    if (parsed.budgetMax !== undefined && car.priceNzd > parsed.budgetMax) return false;
    const { make, model } = makeModel(car);
    return keys.every((word) => make === word || model === word);
  });
}
