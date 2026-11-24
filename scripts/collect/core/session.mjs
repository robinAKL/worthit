import { isAllowed, parseRobots } from './robots.mjs';
import { MIN_INTERVAL_MS, stopReason, waitMs } from './policy.mjs';

/**
 * The only way the collector touches the network.
 *
 * One session per site. It reads robots.txt first, then for every later URL it checks:
 * same origin as the site, allowed by robots, at least `minIntervalMs` since the last
 * request, and no earlier stop. A 403, 429, or challenge page stops the session for good.
 * Adapters never receive this object or `fetch`; they only see HTML strings.
 */
export function createSession({
  origin,
  userAgent,
  fetchImpl,
  minIntervalMs = MIN_INTERVAL_MS,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  if (minIntervalMs < MIN_INTERVAL_MS) {
    throw new Error(`minIntervalMs ${minIntervalMs} is below the ${MIN_INTERVAL_MS} ms floor`);
  }
  const site = new URL(origin).origin;
  const stats = { requests: 0, skipped: 0, errors: 0, stopped: '' };
  let robots = null;
  let lastAt = 0;
  let inFlight = false;

  async function rawGet(url) {
    if (inFlight) throw new Error('concurrency 1: a request is already in flight for this site');
    const delay = waitMs(lastAt, now(), minIntervalMs);
    if (delay > 0) await sleep(delay);
    inFlight = true;
    lastAt = now();
    stats.requests += 1;
    try {
      const response = await fetchImpl(url, { userAgent });
      const body = String(response.body ?? '');
      const stop = stopReason(response.status, body);
      if (stop) {
        stats.stopped = stop;
        stats.errors += 1;
      }
      return { status: response.status, body, url: response.url || url, stop };
    } finally {
      inFlight = false;
    }
  }

  return {
    stats,
    get stopped() {
      return Boolean(stats.stopped);
    },
    get robots() {
      return robots;
    },

    /** Must be the first call. Returns false when the site cannot be collected this run. */
    async loadRobots() {
      const res = await rawGet(new URL('/robots.txt', site).href);
      if (res.stop) return false;
      if (res.status >= 400) {
        stats.errors += 1;
        stats.stopped = `robots HTTP ${res.status}`;
        return false;
      }
      robots = parseRobots(res.body);
      return true;
    },

    /** True when the session would fetch this URL. Does not count as a skip. */
    permits(url) {
      if (!robots || stats.stopped) return false;
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        return false;
      }
      return parsed.origin === site && isAllowed(parsed.href, robots);
    },

    /**
     * Fetch one page. Returns null without any request when the session has stopped,
     * robots has not been read, the URL is on another origin, or robots disallows it.
     */
    async get(url) {
      if (stats.stopped) return null;
      if (!robots) throw new Error('loadRobots() must run before get()');
      if (!this.permits(url)) {
        stats.skipped += 1;
        return null;
      }
      let res;
      try {
        res = await rawGet(url);
      } catch (error) {
        if (String(error?.message).startsWith('concurrency 1')) throw error;
        stats.errors += 1;
        return null;
      }
      if (res.stop) return null;
      if (res.status >= 400) {
        stats.errors += 1;
        return null;
      }
      // A redirect that leaves the site is treated as a page we did not ask for.
      if (new URL(res.url).origin !== site) {
        stats.skipped += 1;
        return null;
      }
      return res;
    },
  };
}
