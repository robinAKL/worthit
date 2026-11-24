/**
 * Finds detail-page URLs for one site through the session, so robots and pacing apply.
 * Order: sitemaps named in robots.txt (or /sitemap.xml), nested product sitemaps first,
 * then a few listing pages when a sitemap only lists categories.
 *
 * Adapters tune it with plain functions over URLs and HTML. They never fetch.
 */
export const DISCOVERY_DEFAULTS = {
  maxSitemaps: 6,
  maxSeeds: 4,
  maxListings: 8,
  /** A sitemap with this many listing URLs and no detail URLs is treated as a category map. */
  minListingsForFallback: 21,
};

export async function discover(adapter, session, cap) {
  const origin = new URL(adapter.origin).origin;
  const opts = { ...DISCOVERY_DEFAULTS, ...(adapter.discovery ?? {}) };
  const isDetail = adapter.isDetailUrl ?? isProductUrl;
  const isListing = adapter.isListingUrl ?? isListingPage;
  const linksFrom = adapter.linksFromListing ?? productUrlsFromHtml;

  const declared = session.robots.sitemaps.filter((url) => url.startsWith(origin));
  const seeds = adapter.sitemaps?.length
    ? adapter.sitemaps.map((path) => new URL(path, origin).href)
    : declared.length > 0
      ? declared
      : [new URL('/sitemap.xml', origin).href];

  const pages = [];
  const seen = new Set();
  const queue = seeds.slice(0, opts.maxSeeds);
  while (queue.length > 0 && pages.length < cap * 3 && seen.size < opts.maxSitemaps) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    const res = await session.get(sitemapUrl);
    if (session.stopped) return pages;
    if (!res) continue;

    const locs = [...res.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => decodeXml(match[1]));
    const nested = locs.filter((url) => /sitemap/i.test(url) && url.startsWith(origin));
    if (nested.length > 0) {
      const preferred = nested.filter((url) => (adapter.preferSitemap ?? /product/i).test(url));
      queue.push(...(preferred.length > 0 ? preferred : nested).slice(0, opts.maxSeeds));
      continue;
    }

    let added = 0;
    for (const loc of locs) {
      if (!loc.startsWith(origin) || !isDetail(loc)) continue;
      if (!session.permits(loc)) {
        session.stats.skipped += 1;
        continue;
      }
      pages.push(loc);
      added += 1;
      if (pages.length >= cap) break;
    }
    if (pages.length >= cap) return pages;

    const listings = locs.filter((loc) => isListing(loc) && session.permits(loc));
    if (added === 0 && listings.length >= opts.minListingsForFallback) {
      let fetched = 0;
      for (const listing of listings) {
        if (pages.length >= cap || fetched >= opts.maxListings) break;
        const page = await session.get(listing);
        fetched += 1;
        if (session.stopped) return pages;
        if (!page) continue;
        for (const url of linksFrom(page.body, origin)) {
          if (pages.includes(url)) continue;
          if (!session.permits(url)) {
            session.stats.skipped += 1;
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

/** Default detail-page test for retail shops. Vehicle adapters supply their own. */
export function isProductUrl(url) {
  let path = url;
  try {
    const parsed = new URL(url);
    path = `${parsed.pathname}${parsed.search}`;
  } catch {
    return false;
  }
  if (/\/(cart|checkout|account|search|admin|images|orders)(\/|\?|$)/i.test(path)) return false;
  return /productspecification\.aspx\?itemID=\d+|\/products\/[^/?#]+|\/product\/[^/?#]+/i.test(path);
}

export function isListingPage(url) {
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

/** Product links embedded as JSON in a listing page (single-segment paths with a number). */
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

/** Absolute same-origin links from `href` attributes, for adapters that need them. */
export function hrefsFromHtml(html, origin, test = () => true) {
  const urls = new Set();
  for (const match of String(html ?? '').matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)) {
    let url;
    try {
      url = new URL(decodeXml(match[1]), origin);
    } catch {
      continue;
    }
    if (url.origin !== new URL(origin).origin) continue;
    url.hash = '';
    if (test(url.href)) urls.add(url.href);
  }
  return [...urls];
}

function decodeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
