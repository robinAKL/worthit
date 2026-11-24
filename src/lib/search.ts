import { catalog } from './catalog';
import ascentFeed from '../data/feeds/ascent.json';
import babyFeed from '../data/feeds/baby-factory.json';
import aiSpecs from '../data/specs/ai.json';
import { sizeBand, specFromProduct, UNRANKED, type ProductSpec } from './specs';
import { isUnitComparable, MIN_UNIT_GROUP, rankUnitGroup } from './specCompare';
import { parseQuery } from './parseQuery';
import { allVehicles } from './cars';
import { querySelectsCars } from './cars/query';
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

/** Rules first; a cached AI reading (verified against the title at collection time) only fills a gap. */
function withSpec(product: Product): Product {
  const fromRules = specFromProduct(product);
  const fromAi = (aiSpecs as Record<string, ProductSpec | false>)[product.id] || undefined;
  const spec = fromRules?.size || !fromAi ? (fromRules ?? undefined) : fromAi;
  return spec ? { ...product, spec } : product;
}

function liveProducts(): Product[] {
  return ([...ascentFeed.products, ...babyFeed.products] as Product[]).map(withSpec);
}

/** Words that should hit the English titles we actually stored. */
const ALIASES: Record<string, readonly string[]> = {
  fridge: ['fridge', 'refrigerator', 'freezer'],
  refrigerator: ['refrigerator', 'fridge', 'freezer'],
  freezer: ['freezer', 'fridge'],
  冰箱: ['fridge', 'refrigerator', 'freezer'],
  // Chinese words for the categories we collect, so a search in Chinese finds English listings.
  冷柜: ['freezer'],
  冰柜: ['freezer'],
  洗衣机: ['washing machine', 'washer', 'front load', 'top load'],
  干衣机: ['dryer'],
  微波炉: ['microwave'],
  洗碗机: ['dishwasher'],
  烤箱: ['oven'],
  婴儿车: ['stroller', 'pram', 'pushchair', 'buggy'],
  推车: ['stroller', 'pram', 'pushchair', 'buggy'],
  安全座椅: ['car seat', 'carseat', 'booster'],
  增高座椅: ['booster'],
  毛巾: ['towel', 'washer'],
  襁褓: ['wrap', 'swaddle'],
  摄像头: ['camera', 'webcam'],
  监控: ['camera', 'security'],
};

function matchesKeyword(product: Product, keyword: string): boolean {
  const hay = haystack(product);
  return (ALIASES[keyword] ?? [keyword]).some((term) => hay.includes(term));
}

/**
 * Sample products only fill a gap. With no search, any real product hides every sample.
 * With a search, a sample stays only when its category has no real product in the results.
 */
export function withoutNeedlessSamples(products: Product[], browsing: boolean): Product[] {
  const real = products.filter((p) => !p.fixture);
  if (real.length === 0) return products;
  if (browsing) return real;
  const realCategories = new Set(real.map((p) => p.category));
  return products.filter((p) => !p.fixture || !realCategories.has(p.category));
}

function noMatches(parsed: ReturnType<typeof parseQuery>, lane: Lane): SearchResult {
  return { query: parsed, lane, items: [], excludedCount: 0, fixture: false };
}

export function comparisonKey(product: Product): string {
  const base = `${product.fixture ? 'sample' : 'live'}:${product.category}`;
  // Sample laptops compare within a RAM band (16 GB and under, or 32 GB and over).
  if (product.fixture) return product.spec?.family === 'laptop' && sizeBand(product.spec) ? `${base}:${sizeBand(product.spec)}` : base;
  // Known product families compare like with like: fridges with fridges, per litre.
  if (product.spec) return UNRANKED.has(product.spec.family) ? `live:${product.spec.family}:${product.id}` : `spec:${product.spec.family}`;
  const kind = titleKind(product.title);
  return kind ? `${base}:${kind}` : base;
}

function titleKind(title: string): string {
  const value = title.toLowerCase();
  if (/\b(filter|filters|accessory|accessories|kit|cover|mount|mounting|bracket|housing|adapter|cable|injector|power supply)\b/.test(value)) return 'accessory';
  if (/refrigerator|\bfridge\b|\bfreezer\b/.test(value)) return 'refrigerator';
  if (/\bmicrowave\b/.test(value)) return 'microwave';
  if (/washing machine|\bdishwasher\b|\bwasher\b/.test(value)) return 'laundry';
  return '';
}

export function search(query: string, lane: Lane, locale: Locale = DEFAULT_LOCALE, source?: Product[]): SearchResult {
  const parsed = parseQuery(query);
  // A search that names a car we list ("Toyota Aqua") is a car search: no baby wipes called Aqua.
  if (parsed.kind === 'car' || (!source && querySelectsCars(query, allVehicles()))) return noMatches(parsed, lane);
  const pool = (source ?? [...catalog.map(withSpec), ...liveProducts()]).filter((product) => {
    if (parsed.category && product.category !== parsed.category) return false;
    if (parsed.budgetMax !== undefined && product.price > parsed.budgetMax) return false;
    return true;
  });
  const activeKeywords = parsed.keywords.filter((keyword) => pool.some((product) => matchesKeyword(product, keyword)));
  // A word that no product uses is ignored ("for my mum"). If every word misses, and there is
  // no category, show nothing instead of the whole catalogue.
  if (parsed.keywords.length > 0 && activeKeywords.length === 0 && !parsed.category) return noMatches(parsed, lane);
  const found = pool.filter((product) => activeKeywords.every((keyword) => matchesKeyword(product, keyword)));
  const matched = withoutNeedlessSamples(found, !parsed.category && activeKeywords.length === 0);

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
    const sized = group.filter(isUnitComparable);
    // Enough items with a stated size: compare those per litre or kilogram. One item without a
    // size must not push a whole group onto total price, where a bar fridge looks "80% below".
    if (sized.length >= MIN_UNIT_GROUP) {
      items.push(...rankUnitGroup(sized, lane, locale));
      for (const product of group.filter((p) => !isUnitComparable(p))) {
        const reason = unrankedReason(product, locale);
        assertReasonAllowed(reason);
        items.push({ product, lane, score: 0, band: 'mid', reason, ranked: false });
      }
      continue;
    }
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
    const groupMedian = quartile(prices, 0.5);
    const comparable = group.filter((product) => {
      if (product.fixture) return true;
      return product.price >= groupMedian * 0.15 && product.price <= groupMedian * 6;
    });
    for (const product of group) {
      if (comparable.includes(product)) continue;
      if (product.imageCount < 1) {
        excludedCount += 1;
        continue;
      }
      const reason = unrankedReason(product, locale);
      assertReasonAllowed(reason);
      items.push({ product, lane, score: 0, band: 'mid', reason, ranked: false });
    }
    if (!group[0].fixture && comparable.length < 5) {
      for (const product of comparable) {
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
    const rankedPrices = comparable.map((product) => product.price).sort((a, b) => a - b);
    const lowerQuartile = quartile(rankedPrices, 0.25);
    const median = quartile(rankedPrices, 0.5);
    const upperQuartile = quartile(rankedPrices, 0.75);
    for (const product of comparable) {
      if (excludedFrom(product, lane, lowerQuartile, median)) {
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
