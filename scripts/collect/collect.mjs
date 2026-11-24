import { productsFromHtml } from './jsonld.mjs';
import { MIN_INTERVAL_MS, MAX_PRODUCTS_PER_RUN, runCap, stopReason, waitMs } from './policy.mjs';
import { isAllowed, parseRobots } from './robots.mjs';

const FACTS = ['id', 'title', 'category', 'price', 'currency', 'merchant', 'url', 'imageCount', 'condition', 'capturedAt', 'specs'];
const DROPPED_SPEC = new Set(['description', 'review', 'reviews', 'image', 'imageurl', 'images']);

export function keepFacts(row) {
  const kept = {};
  for (const key of FACTS) {
    if (row[key] !== undefined) kept[key] = row[key];
  }
  if (kept.specs && typeof kept.specs === 'object') {
    const specs = {};
    for (const [key, value] of Object.entries(kept.specs)) {
      if (DROPPED_SPEC.has(key.toLowerCase())) continue;
      specs[key] = value;
    }
    kept.specs = specs;
  }
  return kept;
}

/**
 * One site, one request at a time. Reads robots before any product URL.
 * A 403, 429, or challenge page ends the site.
 */
export async function collectSite({
  site,
  limit,
  minIntervalMs = MIN_INTERVAL_MS,
  userAgent,
  fetchImpl,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  capturedAt = new Date().toISOString(),
}) {
  const stats = { id: site.id, requests: 0, skipped: 0, errors: 0, saved: 0, stopped: '' };
  const cap = runCap(limit, MAX_PRODUCTS_PER_RUN);
  let lastAt = 0;
  let stopped = false;

  async function get(url) {
    if (stopped) return { status: 0, body: '', stop: stats.stopped, url };
    const delay = waitMs(lastAt, now(), minIntervalMs);
    if (delay > 0) await sleep(delay);
    lastAt = now();
    stats.requests += 1;
    const response = await fetchImpl(url, { userAgent });
    const body = String(response.body ?? '');
    const stop = stopReason(response.status, body);
    if (stop) {
      stopped = true;
      stats.stopped = stop;
      stats.errors += 1;
    }
    return { status: response.status, body, stop, url: response.url || url };
  }

  const robotsUrl = new URL('/robots.txt', site.origin).href;
  const robotsRes = await get(robotsUrl);
  if (robotsRes.stop) return { ...stats, products: [] };
  if (robotsRes.status >= 400) {
    stats.errors += 1;
    stats.stopped = `robots HTTP ${robotsRes.status}`;
    return { ...stats, products: [] };
  }
  const robots = parseRobots(robotsRes.body);
  const urls = await discover(site, robots, get, stats, cap);
  const products = [];
  const seen = new Set();
  for (const url of urls) {
    if (products.length >= cap || stopped) break;
    if (!isAllowed(url, robots)) {
      stats.skipped += 1;
      continue;
    }
    let page;
    try {
      page = await get(url);
    } catch {
      stats.errors += 1;
      continue;
    }
    if (page.stop || stopped) break;
    if (page.status >= 400) {
      stats.errors += 1;
      continue;
    }
    const found = productsFromHtml(page.body, page.url, site.name, capturedAt).map(keepFacts);
    if (found.length === 0) {
      stats.skipped += 1;
      continue;
    }
    for (const product of found) {
      if (seen.has(product.url) || !isAllowed(product.url, robots)) {
        stats.skipped += 1;
        continue;
      }
      seen.add(product.url);
      products.push(product);
      if (products.length >= cap) break;
    }
  }
  stats.saved = products.length;
  return { ...stats, products };
}

async function discover(site, robots, get, stats, cap) {
  const seeds = robots.sitemaps.filter((url) => url.startsWith(site.origin));
  if (seeds.length === 0) seeds.push(new URL('/sitemap.xml', site.origin).href);
  const pages = [];
  const seen = new Set();
  const queue = seeds.slice(0, 4);
  while (queue.length > 0 && pages.length < cap * 3 && seen.size < 6) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    if (!isAllowed(sitemapUrl, robots)) {
      stats.skipped += 1;
      continue;
    }
    let res;
    try {
      res = await get(sitemapUrl);
    } catch {
      stats.errors += 1;
      continue;
    }
    if (res.stop) return pages;
    if (res.status >= 400) {
      stats.errors += 1;
      continue;
    }
    const locs = [...res.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => decodeXml(match[1]));
    const nested = locs.filter((url) => /sitemap/i.test(url) && url.startsWith(site.origin));
    if (nested.length > 0) {
      const productMaps = nested.filter((url) => /product/i.test(url));
      queue.push(...(productMaps.length > 0 ? productMaps : nested).slice(0, 4));
      continue;
    }
    let added = 0;
    for (const loc of locs) {
      if (!loc.startsWith(site.origin) || !looksLikeProduct(loc)) continue;
      if (!isAllowed(loc, robots)) {
        stats.skipped += 1;
        continue;
      }
      pages.push(loc);
      added += 1;
      if (pages.length >= cap) break;
    }
    if (pages.length >= cap) return pages;
    const listings = locs.filter((loc) => isListingPage(loc) && isAllowed(loc, robots));
    if (added === 0 && listings.length > 20) {
      let fetchedListings = 0;
      for (const listing of listings) {
        if (pages.length >= cap || fetchedListings >= 8) break;
        let res;
        try {
          res = await get(listing);
        } catch {
          stats.errors += 1;
          continue;
        }
        fetchedListings += 1;
        if (res.stop) return pages;
        if (res.status >= 400) {
          stats.errors += 1;
          continue;
        }
        for (const url of productUrlsFromHtml(res.body, site.origin)) {
          if (pages.includes(url)) continue;
          if (!isAllowed(url, robots)) {
            stats.skipped += 1;
            continue;
          }
          pages.push(url);
          if (pages.length >= cap) break;
        }
      }
    }
  }
  return pages;
}

export function productUrlsFromHtml(html, origin) {
  const text = String(html ?? '').replace(/&quot;/g, '"').replace(/\\\//g, '/');
  const urls = new Set();
  for (const match of text.matchAll(/"url"\s*:\s*"(\/[a-z0-9][^"]*\d[^"]*)"/gi)) {
    const path = match[1].split('?')[0];
    if (path.split('/').filter(Boolean).length !== 1) continue;
    if (/^\/(offer|brands|cart|checkout|store-locations|faqs|content|gift-cards)\b/i.test(path)) continue;
    urls.add(new URL(path, origin).href);
  }
  return [...urls];
}

function isListingPage(url) {
  let path = '';
  try {
    path = new URL(url).pathname;
  } catch {
    return false;
  }
  const parts = path.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  return !/^(cart|checkout|account|search|admin|login|log-in|privacy|contact|careers|faqs|gift-cards|hireage|home|brands|store-locations|product-manuals|warranty-registrations)$/i.test(parts[0]);
}

function looksLikeProduct(url) {
  let path = url;
  try {
    const parsed = new URL(url);
    path = `${parsed.pathname}${parsed.search}`;
  } catch {
    return false;
  }
  if (isUtility(url)) return false;
  return /productspecification\.aspx\?itemID=\d+|\/products\/[^/?#]+|\/product\/[^/?#]+/i.test(path);
}

function isUtility(url) {
  return /\/(cart|checkout|account|search|admin|images|orders)(\/|\?|$)/i.test(new URL(url).pathname + new URL(url).search);
}

function decodeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
