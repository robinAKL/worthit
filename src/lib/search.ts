import { catalog } from './catalog';
import ascentFeed from '../data/feeds/ascent.json';
import babyFeed from '../data/feeds/baby-factory.json';
import { parseQuery } from './parseQuery';
import {
  assertReasonAllowed,
  bandFor,
  excludedFrom,
  laneScore,
  quartile,
  reasonFor,
  unrankedReason,
} from './score';
import type { Lane, Locale, Product, SearchResult } from './types';
import { DEFAULT_LOCALE } from './types';

function haystack(product: Product): string {
  const localized = Object.values(product.localizedSpecs ?? {}).flatMap((specs) => Object.values(specs).map(String));
  return [
    product.title,
    product.titles?.['zh-Hans'],
    product.category,
    ...Object.values(product.specs).map(String),
    ...localized,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function liveProducts(): Product[] {
  return [...ascentFeed.products, ...babyFeed.products] as Product[];
}

export function comparisonKey(product: Product): string {
  return `${product.fixture ? 'sample' : 'live'}:${product.category}`;
}

export function search(query: string, lane: Lane, locale: Locale = DEFAULT_LOCALE, source?: Product[]): SearchResult {
  const parsed = parseQuery(query);
  const pool = (source ?? [...catalog, ...liveProducts()]).filter((product) => {
    if (parsed.category && product.category !== parsed.category) return false;
    if (parsed.budgetMax !== undefined && product.price > parsed.budgetMax) return false;
    return true;
  });
  const activeKeywords = parsed.keywords.filter((keyword) =>
    pool.some((product) => haystack(product).includes(keyword)),
  );
  const matched = pool.filter((product) =>
    activeKeywords.every((keyword) => haystack(product).includes(keyword)),
  );

  const byCategory = new Map<string, Product[]>();
  for (const product of matched) {
    const key = comparisonKey(product);
    const group = byCategory.get(key) ?? [];
    group.push(product);
    byCategory.set(key, group);
  }

  const items: SearchResult['items'] = [];
  let excludedCount = 0;
  for (const group of byCategory.values()) {
    if (!group[0].fixture && group.length < 5) {
      for (const product of group) {
        if (product.imageCount < 1) {
          excludedCount += 1;
          continue;
        }
        const reason = unrankedReason(product, locale);
        assertReasonAllowed(reason);
        items.push({ product, lane, score: 0, band: 'mid', reason, ranked: false });
      }
      continue;
    }
    const prices = group.map((product) => product.price).sort((a, b) => a - b);
    const lowerQuartile = quartile(prices, 0.25);
    const median = quartile(prices, 0.5);
    const upperQuartile = quartile(prices, 0.75);
    for (const product of group) {
      if (excludedFrom(product, lane, lowerQuartile)) {
        excludedCount += 1;
        continue;
      }
      if (lane === 'cheap' && product.price > lowerQuartile) continue;
      const reason = reasonFor(product, lane, lowerQuartile, median, locale);
      assertReasonAllowed(reason);
      items.push({
        product,
        lane,
        score: laneScore(product, lane, median),
        band: bandFor(product.price, lowerQuartile, upperQuartile),
        reason,
        ranked: true,
      });
    }
  }

  items.sort((a, b) => Number(b.ranked !== false) - Number(a.ranked !== false) || b.score - a.score);
  return {
    query: parsed,
    lane,
    items,
    excludedCount,
    fixture: items.every((item) => item.product.fixture),
  };
}

export { parseQuery } from './parseQuery';
export { catalog } from './catalog';
