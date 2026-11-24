/** How many complete collects an item can miss before it leaves the feed. */
export const MISS_LIMIT = 3;

export type Misses = Record<string, number>;

export interface ReconcileOptions {
  /** A 403, 429, challenge page, or other hard stop. The previous feed stays. */
  stopped: boolean;
  /** The run hit its cap, so an absent id was not proven gone. */
  capped: boolean;
}

export interface ReconcileResult<T> {
  items: T[];
  misses: Misses;
  wrote: boolean;
  dropped: string[];
}

/**
 * Merge a collect into the feed.
 * A stopped run, or a run that found nothing, does not replace what is already stored.
 * An id absent from a complete run is counted. The third miss removes it.
 */
export function reconcileFeed<T extends { id: string }>(
  existing: T[],
  incoming: T[],
  misses: Misses,
  options: ReconcileOptions,
): ReconcileResult<T> {
  if (options.stopped || incoming.length === 0) {
    return { items: existing, misses, wrote: false, dropped: [] };
  }

  const incomingIds = new Set(incoming.map((item) => item.id));
  const next: Misses = { ...misses };
  const kept: T[] = [];
  const dropped: string[] = [];

  for (const item of existing) {
    if (incomingIds.has(item.id)) continue;
    if (options.capped) {
      kept.push(item);
      continue;
    }
    const count = (next[item.id] ?? 0) + 1;
    if (count >= MISS_LIMIT) {
      dropped.push(item.id);
      delete next[item.id];
    } else {
      next[item.id] = count;
      kept.push(item);
    }
  }

  for (const id of incomingIds) next[id] = 0;
  return { items: [...incoming, ...kept], misses: next, wrote: true, dropped };
}
