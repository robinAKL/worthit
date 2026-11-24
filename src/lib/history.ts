/** Daily price points. One entry per day, kept for 90 days. */

export interface PricePoint {
  date: string;
  price: number;
}

export type PriceHistory = Record<string, PricePoint[]>;

const DAY = 86_400_000;

export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/**
 * Add today's price for each row. The same day replaces the previous point.
 * Points older than `keepDays` are dropped. Ids missing from this run keep their trimmed history.
 */
export function appendSnapshots(
  history: PriceHistory,
  rows: { id: string; price: number }[],
  today: string,
  keepDays = 90,
): PriceHistory {
  const cutoff = shiftDay(today, -(keepDays - 1));
  const incoming = new Map(rows.map((row) => [row.id, row.price]));
  const next: PriceHistory = {};
  for (const id of new Set([...Object.keys(history), ...incoming.keys()])) {
    const kept = (history[id] ?? []).filter((point) => point.date !== today && point.date >= cutoff && point.date <= today);
    const price = incoming.get(id);
    const points = price === undefined ? kept : [...kept, { date: today, price }];
    points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (points.length > 0) next[id] = points.slice(-keepDays);
  }
  return next;
}

export interface PriceRead {
  low30: number;
  median30: number;
  /** Against the previous recorded day. Absent when this is the only point. */
  change?: 'down' | 'up' | 'flat';
  /**
   * Advertised previous price that never occurs in a covered window, and every recorded price sits below it.
   * False until the window itself spans 28 days.
   */
  suspiciousWas: boolean;
  /** Current price is the window low. False until the window itself spans 28 days. */
  atLow: boolean;
  /** Earliest point is at least 28 days before today, and at least 4 different dates are recorded. */
  covered: boolean;
  earliest?: string;
}

function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / DAY);
}

/** Stats for the 30 days ending on `today`, inclusive. Null when the window is empty. */
export function readPrice(points: PricePoint[], today: string, wasPrice?: number): PriceRead | null {
  const cutoff = shiftDay(today, -29);
  const window = points.filter((point) => point.date >= cutoff && point.date <= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (window.length === 0) return null;
  const prices = window.map((point) => point.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const current = window[window.length - 1];
  const previous = window.length > 1 ? window[window.length - 2] : undefined;
  const earliest = window[0].date;
  const covered = daysBetween(earliest, today) >= 28 && new Set(window.map((point) => point.date)).size >= 4;
  const wasKnown = wasPrice !== undefined && wasPrice > 0;
  const allBelowWas = wasKnown && window.every((point) => point.price < wasPrice);
  const wasNeverSeen = wasKnown && !window.some((point) => point.price === wasPrice);
  return {
    low30: prices[0],
    median30: prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2,
    change: previous === undefined ? undefined : current.price < previous.price ? 'down' : current.price > previous.price ? 'up' : 'flat',
    suspiciousWas: covered && allBelowWas && wasNeverSeen,
    atLow: covered && current.price <= prices[0],
    covered,
    earliest,
  };
}
