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

/** "Higher spec" compares items priced within this share of the group median, so it never favours a dearer class. */
export const SPEC_PRICE_BAND = 0.25;

/**
 * What we can measure about a product's spec, added up. Only comparable within one group.
 * Energy stars count one point each, warranty one point a year, capacity up to two points
 * against the largest in the group, and laptop memory, storage and processor tier.
 * 0 when nothing measurable is known.
 */
export function specPoints(product: Product, maxSize?: number): number {
  const s = product.spec;
  let points = 0;
  if (s?.energyStars) points += s.energyStars;
  if (product.warrantyMonths) points += product.warrantyMonths / 12;
  if (s?.size && maxSize) points += (2 * s.size) / maxSize;
  if (s?.ramGb) points += s.ramGb / 8;
  if (s?.storageGb) points += s.storageGb / 512;
  if (s?.cpuTier) points += { entry: 0, mid: 1, high: 2 }[s.cpuTier];
  return points;
}

export function inSpecPriceBand(price: number, median: number): boolean {
  return price >= median * (1 - SPEC_PRICE_BAND) && price <= median * (1 + SPEC_PRICE_BAND);
}

/** Photo counts never decide anything here: they say nothing about whether a price is fair. */
export function excludedFrom(product: Product, lane: Lane, lowerQuartile: number, median = Infinity): boolean {
  const reviews = product.reviewCount ?? 0;
  if (lane === 'cheap') {
    if (/out of stock/i.test(String(product.specs.stock ?? ''))) return true;
    if (!hasSpecs(product)) return true;
    const reviewRisk = product.fixture || product.condition === 'used';
    return reviewRisk && reviews === 0 && product.price < lowerQuartile * 0.7;
  }
  if (lane === 'value') {
    return !hasSpecs(product);
  }
  // Higher spec: something measurable, and priced like the rest of the group.
  return specPoints(product) === 0 || (Number.isFinite(median) && !inSpecPriceBand(product.price, median));
}

export function laneScore(product: Product, lane: Lane, median: number): number {
  if (lane === 'cheap') return -product.price;
  // Value: how far below the group's middle price, as a share. Nothing else is mixed in.
  if (lane === 'value') return 1 - product.price / median;
  // Higher spec: more measurable spec first; the lower price breaks a tie.
  return specPoints(product) - (product.price / median) * 0.001;
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
      const pct = Math.round(Math.abs(1 - price / median) * 100);
      const cmp = pct < 1 ? '与中位基本一致' : price < median ? `低 ${pct}%` : `高 ${pct}%`;
      return `标价 ${price} 纽币，${midLabel}，${cmp}。${facts}${tail}`;
    }
    return `价格在同组中位 ${mid} 上下 25% 以内，${specSummary(product, 'zh-Hans')}。标价 ${price} 纽币。${tail}`;
  }
  if (lane === 'cheap') {
    const band = sample ? `the sample lower quartile of ${q1}` : `the lower quartile of ${q1} in this group`;
    return `Listed at ${price} NZD, at or below ${band}. ${facts}${tail}`;
  }
  if (lane === 'value') {
    const midLabel = sample ? `The sample median is ${mid}` : `The median in this group is ${mid}`;
    const pct = Math.round(Math.abs(1 - price / median) * 100);
    const cmp = pct < 1 ? 'about the same' : price < median ? `${pct}% below` : `${pct}% above`;
    return `Listed at ${price} NZD. ${midLabel}, so this is ${cmp}. ${facts}${tail}`;
  }
  return `Priced within 25% of the ${mid} NZD median in this group, ${specSummary(product, 'en')}. Listed at ${price} NZD. ${tail}`;
}

/** The measurable spec behind a "Higher spec" ranking, e.g. "5 energy stars, 2-year warranty". */
function specSummary(product: Product, locale: Locale): string {
  const s = product.spec;
  const parts: string[] = [];
  if (s?.energyStars) parts.push(locale === 'zh-Hans' ? `节能 ${s.energyStars} 星` : `${s.energyStars} energy stars`);
  if (product.warrantyMonths) parts.push(locale === 'zh-Hans' ? `保修 ${product.warrantyMonths} 个月` : `${product.warrantyMonths}-month warranty`);
  if (s?.ramGb) parts.push(`${s.ramGb} GB ${locale === 'zh-Hans' ? '内存' : 'memory'}`);
  if (s?.storageGb) parts.push(`${s.storageGb} GB ${locale === 'zh-Hans' ? '存储' : 'storage'}`);
  if (s?.cpuTier) parts.push(locale === 'zh-Hans' ? `处理器档次 ${{ entry: '入门', mid: '中端', high: '高端' }[s.cpuTier]}` : `${s.cpuTier}-tier processor`);
  if (parts.length === 0) return locale === 'zh-Hans' ? '规格有可比较的数据' : 'with measurable spec';
  return locale === 'zh-Hans' ? `规格：${parts.join('、')}` : `with ${parts.join(', ')}`;
}

/** A captured group smaller than five has no quartile to cite. */
export function unrankedReason(product: Product, locale: Locale): string {
  const price = Math.round(product.price);
  if (locale === 'zh-Hans') return `标价 ${price} 纽币。这是采集到的商家标价。`;
  return `Listed at ${price} NZD. Price captured from the merchant.`;
}
