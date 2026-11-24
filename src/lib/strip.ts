/** Where a price and an optional reference sit on the min–max line of one comparison group. */
export function stripLayout(prices: number[], value: number, marker?: number) {
  if (prices.length === 0) return null;
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const span = high - low;
  const at = (n: number) => (span === 0 ? 50 : Math.min(100, Math.max(0, ((n - low) / span) * 100)));
  return { low, high, valueAt: at(value), markerAt: marker === undefined ? undefined : at(marker) };
}
