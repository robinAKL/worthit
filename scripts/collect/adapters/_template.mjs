/**
 * Copy this file to adapters/<site-id>.mjs and add it to adapters/index.mjs.
 *
 * The core does every request: robots.txt, same-origin, 2 s pacing, concurrency 1,
 * stop on 403/429/captcha, run caps, and the fact whitelist. An adapter cannot change
 * those and must not try (checkAdapter rejects fetch, headers, userAgent, proxy, ...).
 */
import { hrefsFromHtml } from '../core/discover.mjs';
import { vehiclesFromHtml } from '../core/extract/jsonld.mjs';

export default {
  id: 'example-cars', // lowercase slug, also the output file name
  name: 'Example Cars', // dealer or merchant display name
  origin: 'https://www.example.co.nz',
  kind: 'vehicle', // 'product' or 'vehicle'
  enabled: false,
  disabledReason: 'template only',

  // Optional. Sitemap paths to start from instead of the ones robots.txt declares.
  // sitemaps: ['/sitemap.xml'],

  // A detail page holds one item.
  isDetailUrl: (url) => /\/vehicles?\/\d+/.test(new URL(url).pathname),

  // A listing page links to detail pages. Used when the sitemap only lists listings.
  isListingUrl: (url) => /^\/(used-cars|stock)\/?$/.test(new URL(url).pathname),
  linksFromListing: (html, origin) => hrefsFromHtml(html, origin, (url) => /\/vehicles?\/\d+/.test(url)),

  // Turn one detail page into rows. Prefer JSON-LD; fall back to page text only for facts.
  // Return raw rows; the core keeps whitelisted facts only.
  extract: (html, { url, name, capturedAt }) => vehiclesFromHtml(html, url, name, capturedAt),

  // Leave false until the dealer gives written permission to show one cover image.
  imagePermission: false,
};
