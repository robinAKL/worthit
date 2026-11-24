/**
 * How a price compares with its reference (our estimate for a car, the group median for a product),
 * in a form the cards can show at a glance. Pure functions; the UI adds words and colour.
 */

export type DealTier = 'well-below' | 'below' | 'near' | 'above' | 'well-above';
export type Confidence = 1 | 2 | 3;

/** Tier edges as a fraction of the reference price. */
export const TIER_EDGES = { wellBelow: -0.15, below: -0.05, above: 0.05, wellAbove: 0.15 } as const;

/** gap = price / reference - 1. */
export function dealTier(gap: number): DealTier {
  if (gap <= TIER_EDGES.wellBelow) return 'well-below';
  if (gap <= TIER_EDGES.below) return 'below';
  if (gap < TIER_EDGES.above) return 'near';
  if (gap < TIER_EDGES.wellAbove) return 'above';
  return 'well-above';
}

/** Reference minus price, rounded to $10. Positive means the price is under the reference. */
export function savings(price: number, reference: number): number {
  return Math.round((reference - price) / 10) * 10;
}

/** 1-based position by price among `prices` (which includes this item): 1 = lowest. Ties share the lower rank. */
export function priceRankIn(prices: number[], price: number): number {
  return 1 + prices.filter((p) => p < price).length;
}

/** More comparable items behind a reference means a firmer claim. */
export function confidenceFrom(samples: number): Confidence {
  if (samples >= 8) return 3;
  if (samples >= 4) return 2;
  return 1;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** A set of comparable prices with this item's place in it. */
export interface Cohort {
  /**
   * 'model' = same make and model, 'segment' = same body and nearby years, 'group' = product group,
   * 'none' = nothing close enough to compare with.
   */
  kind: 'model' | 'segment' | 'group' | 'none';
  /** Human label, e.g. "Toyota Aqua" or "hatchback". */
  label: string;
  /** Sorted ascending, includes this item. */
  prices: number[];
  rank: number;
  /** Year span of the comparison, e.g. [2016, 2020]. */
  years?: [number, number];
  /** Cars: `prices` are the peers' prices adjusted to this car's age and kilometres. */
  adjusted?: boolean;
  /** When set, `prices` are prices per unit (e.g. NZD per litre) and `size` is this item's size. */
  unit?: import('./specs').Unit;
  size?: number;
  /** Product family for per-unit groups, e.g. "fridge". */
  family?: string;
  /** Size band the comparison was limited to, e.g. "mid" for 200-449 L fridges. */
  band?: string;
}
