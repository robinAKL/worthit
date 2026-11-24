/** Above this p90/p10 price ratio a group mixes different products, so we make no rank claim. */
const MAX_SPREAD = 3;

/** A group is comparable only when it has at least three prices and they sit within 3x of each other. */
export function isComparableGroup(prices: number[]): boolean {
  const size = prices.length;
  const p10 = prices[Math.floor((size - 1) * 0.1)] ?? 0;
  const p90 = prices[Math.ceil((size - 1) * 0.9)] ?? 0;
  const mixed = size >= 3 && p10 > 0 && p90 / p10 > MAX_SPREAD;
  return size >= 3 && !mixed;
}

/** Rank marks (第 1 / No. 1) only belong on a comparable group. A mixed group makes no claim. */
export function placeMarkFor(
  comparable: boolean,
  rank: number,
  label: (rank: number) => string,
): string | undefined {
  return comparable ? label(rank) : undefined;
}
