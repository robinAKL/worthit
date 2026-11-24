import type { Band, Lane, Product } from './types';

const BANNED = ['最便宜', '最精致', '全市场', '保证便宜', '最优'];

export function assertReasonAllowed(reason: string): void {
  for (const phrase of BANNED) {
    if (reason.includes(phrase)) {
      throw new Error(`reason contains banned phrase: ${phrase}`);
    }
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

export function hasSpecs(product: Product): boolean {
  return Object.keys(product.specs).filter((key) => key !== 'note').length > 0;
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
  if (lane === 'cheap') {
    if (product.imageCount < 3) return true;
    if (reviews === 0 && product.price < lowerQuartile * 0.7) return true;
    return false;
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

export function reasonFor(product: Product, lane: Lane, lowerQuartile: number, median: number): string {
  const price = Math.round(product.price);
  const q1 = Math.round(lowerQuartile);
  const mid = Math.round(median);
  const reviews = product.reviewCount ?? 0;
  if (lane === 'cheap') {
    return `标价 ${price} 纽币，低于同组示例价的下四分位 ${q1}。图片 ${product.imageCount} 张，反馈 ${reviews} 条。这是示例价，不是在售价。`;
  }
  if (lane === 'value') {
    const specCount = Object.keys(product.specs).filter((key) => key !== 'note').length;
    return `标价 ${price} 纽币，同组示例中位是 ${mid}。规格写了 ${specCount} 项，反馈 ${reviews} 条。这是示例价，不是在售价。`;
  }
  const note = String(product.specs.note ?? '');
  return `反馈 ${reviews} 条，成色写明：${note} 标价 ${price} 纽币，不是同组里最低的。这是示例价，不是在售价。`;
}
