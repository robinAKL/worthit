import ascentFeed from '../data/feeds/ascent.json';
import babyFeed from '../data/feeds/baby-factory.json';
import type { Copy } from '../i18n/en';
import { dayOf, readPrice, type PriceHistory, type PricePoint } from './history';
import { matchOffers, otherShops } from './offers';
import type { Product } from './types';

const historyFiles = import.meta.glob<PriceHistory>('../data/history/*.json', { eager: true, import: 'default' });

const pointsById = new Map<string, PricePoint[]>();
for (const file of Object.values(historyFiles)) {
  for (const [id, points] of Object.entries(file)) pointsById.set(id, points);
}

const live = [...(ascentFeed.products as Product[]), ...(babyFeed.products as Product[])];
const groups = matchOffers(live);

export function historySentence(product: Product, copy: Copy['results']['history'], money: (n: number) => string): string {
  const points = pointsById.get(product.id);
  const parts: string[] = [];
  if (points && points.length > 0) {
    const today = points[points.length - 1].date || dayOf(product.capturedAt);
    const read = readPrice(points, today, product.wasPrice);
    if (read) {
      parts.push(read.atLow ? copy.atLow : copy.low(money(read.low30)));
      if (read.change === 'down') parts.push(copy.down);
      if (read.change === 'up') parts.push(copy.up);
      if (read.suspiciousWas && product.wasPrice) parts.push(copy.suspicious(money(product.wasPrice)));
    }
  }
  const others = otherShops(product, groups);
  if (others) parts.push(copy.others(others.count, money(others.low)));
  return parts.join(' ');
}
