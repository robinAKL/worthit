// Collector modules are plain JavaScript. This file checks behaviour, not their types.
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { collectSite, keepFacts, productUrlsFromHtml } from '../../scripts/collect/collect.mjs';
import { productsFromHtml } from '../../scripts/collect/jsonld.mjs';
import { MAX_PRODUCTS_PER_RUN, runCap, stopReason, USER_AGENT, waitMs } from '../../scripts/collect/policy.mjs';
import { isAllowed, parseRobots } from '../../scripts/collect/robots.mjs';
import { parseFeed } from './feed/parseFeed';

const ROBOTS = `User-agent: *
Disallow: /images/
Disallow: /search
Disallow: /cart
Allow: /products/
Sitemap: https://shop.example/sitemap.xml

User-agent: Googlebot
Allow: /search
`;

const PRODUCT = `<html><head>
<script type="application/ld+json">
{"@type":"Product","name":"Oak desk","sku":"D1","brand":{"@type":"Brand","name":"Sample"},
"description":"Handwritten marketing copy that must not be stored.",
"image":["https://shop.example/images/a.jpg","https://shop.example/images/b.jpg","https://shop.example/images/c.jpg"],
"review":[{"reviewBody":"loved it"}],
"offers":{"@type":"Offer","price":"499.00","priceCurrency":"NZD","availability":"https://schema.org/InStock"}}
</script></head></html>`;

describe('robots and limits', () => {
  it('merges consecutive user-agents, every star group, and prefers WorthItBot', () => {
    const shared = parseRobots('User-agent: *\nUser-agent: Googlebot\nDisallow: /p/');
    expect(isAllowed('https://shop.example/p/x', shared)).toBe(false);
    const merged = parseRobots('User-agent: *\nDisallow: /a\n\nUser-agent: *\nDisallow: /b');
    expect(isAllowed('https://shop.example/a', merged)).toBe(false);
    expect(isAllowed('https://shop.example/b', merged)).toBe(false);
    const own = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: WorthItBot\nAllow: /products/\nDisallow: /private');
    expect(isAllowed('https://shop.example/products/oak', own)).toBe(true);
    expect(isAllowed('https://shop.example/private', own)).toBe(false);
  });

  it('uses only the * group and skips disallowed paths', () => {
    const robots = parseRobots(ROBOTS);
    expect(isAllowed('https://shop.example/products/oak-desk', robots)).toBe(true);
    expect(isAllowed('https://shop.example/images/a.jpg', robots)).toBe(false);
    expect(isAllowed('https://shop.example/search?q=desk', robots)).toBe(false);
    expect(isAllowed('https://shop.example/cart', robots)).toBe(false);
    expect(robots.rules.some((rule) => rule.path === '/search' && rule.allow)).toBe(false);
  });

  it('waits at least two seconds and refuses more than 200 products', () => {
    expect(waitMs(1_000, 2_000)).toBe(1000);
    expect(waitMs(0, 5_000)).toBe(0);
    expect(runCap(50)).toBe(50);
    expect(runCap(500)).toBe(MAX_PRODUCTS_PER_RUN);
    expect(USER_AGENT).toBe('WorthItBot/0.1 (+https://github.com/robinAKL/worthit)');
  });

  it('stops on 403, 429, and a captcha page', () => {
    expect(stopReason(403, 'no')).toBe('HTTP 403');
    expect(stopReason(429, 'slow down')).toBe('HTTP 429');
    expect(stopReason(200, '<div class="g-recaptcha"></div>')).toBe('captcha');
    expect(stopReason(200, '<html>ok</html>')).toBe('');
  });
});

describe('json-ld facts', () => {
  it('keeps price facts and drops images, descriptions, and reviews', () => {
    const [row] = productsFromHtml(PRODUCT, 'https://shop.example/products/oak-desk', 'Shop', '2026-11-24T00:00:00.000Z');
    const kept = keepFacts(row);
    const serial = JSON.stringify(kept);
    expect(kept.imageCount).toBe(3);
    expect(kept.specs.brand).toBe('Sample');
    expect(kept.specs.model).toBe('D1');
    expect(kept.specs.stock).toBe('in stock');
    expect(serial).not.toContain('images/a.jpg');
    expect(serial).not.toContain('Handwritten marketing');
    expect(serial).not.toContain('loved it');
    expect(serial).not.toContain('description');
    const parsed = parseFeed(JSON.stringify({ products: [kept] }));
    expect(parsed.errors).toEqual([]);
    expect(parsed.products[0].source).toBe('feed');
    expect(parsed.products[0].fixture).toBe(false);
    expect(parsed.products[0].imageUrl).toBeUndefined();
  });

  it('keeps a fridge and a car seat in different categories', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","name":"Cold box","category":"Appliances > Fridges","offers":{"price":"900","priceCurrency":"NZD"}}
      </script>
      <script type="application/ld+json">
      {"@graph":[
        {"@type":"BreadcrumbList","itemListElement":[{"name":"Home"},{"name":"Car seats"}]},
        {"@type":"Product","name":"Booster","offers":{"price":"80","priceCurrency":"NZD"}}
      ]}
      </script>`;
    const rows = productsFromHtml(html, 'https://shop.example/p', 'Shop', '2026-11-24T00:00:00.000Z');
    expect(rows.map((row) => row.category).sort()).toEqual(['car-seats', 'fridges']);
  });
});

describe('listing links', () => {
  it('reads product urls out of a category page and ignores offers', () => {
    const html = '{"url":"/medela-solo-pump-4021269-white"}{"url":"/offer/2-for-14-311"}';
    expect(productUrlsFromHtml(html, 'https://www.babyfactory.co.nz')).toEqual([
      'https://www.babyfactory.co.nz/medela-solo-pump-4021269-white',
    ]);
  });
});

describe('collectSite', () => {
  const site = { id: 'shop', name: 'Shop', origin: 'https://shop.example' };

  function scripted(pages: Record<string, { status: number; body: string }>) {
    const calls: string[] = [];
    let clock = 0;
    const fetchImpl = async (url: string) => {
      calls.push(url);
      const hit = pages[url];
      if (!hit) return { status: 404, body: '', url };
      return { ...hit, url };
    };
    const sleep = async (ms: number) => {
      clock += ms;
    };
    return { calls, fetchImpl, now: () => clock, sleep };
  }

  it('skips a disallowed url, stays serial, and stops after 403', async () => {
    const html = PRODUCT;
    const net = scripted({
      'https://shop.example/robots.txt': { status: 200, body: ROBOTS },
      'https://shop.example/sitemap.xml': {
        status: 200,
        body: `<urlset>
          <url><loc>https://shop.example/products/oak-desk</loc></url>
          <url><loc>https://shop.example/images/hidden</loc></url>
          <url><loc>https://shop.example/products/next</loc></url>
          <url><loc>https://shop.example/products/after-block</loc></url>
        </urlset>`,
      },
      'https://shop.example/products/oak-desk': { status: 200, body: html },
      'https://shop.example/products/next': { status: 403, body: 'blocked' },
      'https://shop.example/products/after-block': { status: 200, body: html },
    });
    const result = await collectSite({
      site,
      limit: 50,
      userAgent: USER_AGENT,
      fetchImpl: net.fetchImpl,
      now: net.now,
      sleep: net.sleep,
      capturedAt: '2026-11-24T00:00:00.000Z',
    });
    expect(net.calls).not.toContain('https://shop.example/images/hidden');
    expect(net.calls).not.toContain('https://shop.example/products/after-block');
    expect(result.stopped).toBe('HTTP 403');
    expect(result.saved).toBe(1);
    expect(result.requests).toBeGreaterThan(0);
    expect(net.calls.filter((url) => url.includes('/products/')).length).toBe(2);
  });

  it('does not fetch a second page until two seconds have elapsed', async () => {
    const stamps: number[] = [];
    let clock = 10_000;
    const fetchImpl = async (url: string) => {
      stamps.push(clock);
      if (url.endsWith('/robots.txt')) {
        return { status: 200, body: 'User-agent: *\nAllow: /\nSitemap: https://shop.example/sitemap.xml\n', url };
      }
      if (url.endsWith('/sitemap.xml')) {
        return {
          status: 200,
          body: '<urlset><url><loc>https://shop.example/products/one</loc></url><url><loc>https://shop.example/products/two</loc></url></urlset>',
          url,
        };
      }
      return { status: 200, body: PRODUCT, url };
    };
    await collectSite({
      site,
      limit: 2,
      userAgent: USER_AGENT,
      fetchImpl,
      now: () => clock,
      sleep: async (ms: number) => {
        clock += ms;
      },
      capturedAt: '2026-11-24T00:00:00.000Z',
    });
    for (let i = 1; i < stamps.length; i += 1) {
      expect(stamps[i] - stamps[i - 1]).toBeGreaterThanOrEqual(2000);
    }
    expect(stamps.length).toBeGreaterThanOrEqual(4);
  });
});
