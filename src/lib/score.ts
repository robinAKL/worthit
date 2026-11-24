import type { Band, Lane, Locale, Product } from './types';

const BANNED = ['最便宜', '最精致', '全市场', '保证便宜', '最优', 'cheapest', 'lowest in market'];

export function assertReasonAllowed(reason: string): void {
  const lower = reason.toLowerCase();
  for (const phrase of BANNED) {
    if (lower.includes(phrase.toLowerCase())) {
      throw new Error(`reason contains banned phrase: ${phrase}`);
    }
  }
  if (/\bbest\b/i.test(reason)) {
    throw new Error('reason contains banned phrase: best');
  }
}

export function quartile(sortedPrices: number[], fraction: number): number {
  if (sortedPrices.length === 0) return 0;
  const index = (sortedPrices.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedPrices[lower];
  return sortedPrices[lower] + (sortedPrices[upper] - sortedPrices[lower]) * (index - lower);
}

export function countsAsSpec(product: Product, key: string, value: string | number): boolean {
  if (key === 'note') return false;
  const text = String(value);
  return !(key === 'model' && /^\d+$/.test(text) && product.url.includes(text));
}

export function hasSpecs(product: Product): boolean {
  return Object.entries(product.specs).some(([key, value]) => countsAsSpec(product, key, value));
}

export function conditionIsSpecific(product: Product): boolean {
  const note = String(product.specs.note ?? '').trim();
  return note.length >= 8 && note !== '很好';
}

export function bandFor(price: number, lowerQuartile: number, upperQuartile: number): Band {
  if (price <= lowerQuartile) return 'low';
  if (price <= upperQuartile) return 'mid';
  return 'high';
}

export function excludedFrom(product: Product, lane: Lane, lowerQuartile: number): boolean {
  const reviews = product.reviewCount ?? 0;
  if (product.fixture ? product.imageCount < 3 : product.imageCount < 1) return true;
  if (lane === 'cheap') {
    const reviewRisk = product.fixture || product.condition === 'used';
    return reviewRisk && reviews === 0 && product.price < lowerQuartile * 0.7;
  }
  if (lane === 'value') {
    return !hasSpecs(product);
  }
  return !conditionIsSpecific(product);
}

export function laneScore(product: Product, lane: Lane, median: number): number {
  const reviews = product.reviewCount ?? 0;
  if (lane === 'cheap') return -product.price;
  if (lane === 'value') {
    const belowMedian = Math.max(0, median - product.price);
    return belowMedian + reviews * 10 + product.imageCount * 5;
  }
  return reviews * 10 + product.imageCount * 8 + (conditionIsSpecific(product) ? 40 : 0) + (product.warrantyMonths ?? 0);
}

export function reasonFor(
  product: Product,
  lane: Lane,
  lowerQuartile: number,
  median: number,
  locale: Locale,
): string {
  const price = Math.round(product.price);
  const q1 = Math.round(lowerQuartile);
  const mid = Math.round(median);
  const reviews = product.reviewCount ?? 0;
  const specCount = Object.entries(product.specs).filter(([key, value]) => countsAsSpec(product, key, value)).length;
  const sample = product.fixture;
  const facts = sample
    ? locale === 'zh-Hans'
      ? `图片 ${product.imageCount} 张，反馈 ${reviews} 条。`
      : `${product.imageCount} photos, ${reviews} reviews. `
    : product.reviewCount === undefined
      ? ''
      : locale === 'zh-Hans'
        ? `反馈 ${product.reviewCount} 条。`
        : `${product.reviewCount} reviews. `;
  const tail =
    locale === 'zh-Hans'
      ? sample
        ? '这是示例价，不是在售价。'
        : '这是采集到的商家标价。'
      : sample
        ? 'Sample price, not a live price.'
        : 'Price captured from the merchant.';
  if (locale === 'zh-Hans') {
    if (lane === 'cheap') {
      const band = sample ? `同组示例价的下四分位 ${q1}` : `同组的下四分位 ${q1}`;
      return `标价 ${price} 纽币，不高于${band}。${facts}${tail}`;
    }
    if (lane === 'value') {
      const midLabel = sample ? `同组示例中位是 ${mid}` : `同组中位是 ${mid}`;
      const specs = sample ? `规格写了 ${specCount} 项，反馈 ${reviews} 条。` : `规格写了 ${specCount} 项。${facts}`;
      return `标价 ${price} 纽币，${midLabel}。${specs}${tail}`;
    }
    const note = String(product.localizedSpecs?.['zh-Hans']?.note ?? product.specs.note ?? '');
    const lead = sample ? `反馈 ${reviews} 条，` : facts;
    return `${lead}成色写明：${note} 标价 ${price} 纽币，不是同组里最低的。${tail}`;
  }
  if (lane === 'cheap') {
    const band = sample ? `the sample lower quartile of ${q1}` : `the lower quartile of ${q1} in this group`;
    return `Listed at ${price} NZD, at or below ${band}. ${facts}${tail}`;
  }
  if (lane === 'value') {
    const midLabel = sample ? `The sample median is ${mid}` : `The median in this group is ${mid}`;
    const specs = sample ? `${specCount} specs filled in, ${reviews} reviews. ` : `${specCount} specs filled in. ${facts}`;
    return `Listed at ${price} NZD. ${midLabel}. ${specs}${tail}`;
  }
  const group = sample ? 'this sample' : 'this group';
  const lead = sample ? `${reviews} reviews, and the condition is written out in detail. ` : facts;
  return `${lead}Listed at ${price} NZD, not the lowest price in ${group}. ${tail}`;
}

/** A captured group smaller than five has no quartile to cite. */
export function unrankedReason(product: Product, locale: Locale): string {
  const price = Math.round(product.price);
  if (locale === 'zh-Hans') return `标价 ${price} 纽币。这是采集到的商家标价。`;
  return `Listed at ${price} NZD. Price captured from the merchant.`;
}
