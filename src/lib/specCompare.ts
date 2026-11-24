import { assertReasonAllowed, quartile } from './score';
import { FAMILY_UNIT, unitPrice, type ProductSpec, type Unit } from './specs';
import type { Band, Lane, Locale, Product, Recommendation } from './types';

/** Families compared per unit need at least this many sized items to rank. */
export const MIN_UNIT_GROUP = 5;

const FAMILY_NAME: Record<Locale, Record<string, string>> = {
  en: { fridge: 'fridges', freezer: 'freezers', washer: 'washers', dryer: 'dryers', microwave: 'microwaves', dishwasher: 'dishwashers', oven: 'ovens' },
  'zh-Hans': { fridge: '冰箱', freezer: '冷柜', washer: '洗衣机', dryer: '干衣机', microwave: '微波炉', dishwasher: '洗碗机', oven: '烤箱' },
};
export const UNIT_NAME: Record<Locale, Record<Unit, string>> = {
  en: { L: 'litre', kg: 'kg', place: 'place setting' },
  'zh-Hans': { L: '升', kg: '公斤', place: '套' },
};
const SIZE_LABEL: Record<Locale, (size: number, unit: Unit) => string> = {
  en: (size, unit) => (unit === 'L' ? `${size} L` : unit === 'kg' ? `${size} kg` : `${size} place settings`),
  'zh-Hans': (size, unit) => `${size} ${UNIT_NAME['zh-Hans'][unit]}`,
};

export function familyName(family: string, locale: Locale): string {
  return FAMILY_NAME[locale][family] ?? family;
}
export function sizeLabel(size: number, unit: Unit, locale: Locale): string {
  return SIZE_LABEL[locale](size, unit);
}

/** True when this product can be compared per unit within its family. */
export function isUnitComparable(product: Product): product is Product & { spec: ProductSpec & { size: number; unit: Unit } } {
  return !product.fixture && Boolean(product.spec?.size && product.spec.unit && FAMILY_UNIT[product.spec.family]);
}

function money(n: number): string {
  return `$${n.toLocaleString('en-NZ', { minimumFractionDigits: n < 100 ? 2 : 0, maximumFractionDigits: n < 100 ? 2 : 0 })}`;
}

function reasonFor(product: Product, lane: Lane, perUnit: number, medianPerUnit: number, locale: Locale): string {
  const spec = product.spec!;
  const unit = spec.unit!;
  const size = sizeLabel(spec.size!, unit, locale);
  const fam = familyName(spec.family, locale);
  const price = money(Math.round(product.price));
  if (locale === 'zh-Hans') {
    const base = `${size}，标价 ${price}，每${UNIT_NAME['zh-Hans'][unit]} ${money(perUnit)}；同类${fam}每${UNIT_NAME['zh-Hans'][unit]}中位 ${money(medianPerUnit)}。`;
    if (lane === 'refined') return `${base}容量在同类里排在前面。这是采集到的商家标价。`;
    return `${base}这是采集到的商家标价。`;
  }
  const base = `${size} for ${price}, ${money(perUnit)} per ${UNIT_NAME.en[unit]}. Similar ${fam}: ${money(medianPerUnit)} per ${UNIT_NAME.en[unit]} at the median.`;
  if (lane === 'refined') return `${base} One of the larger ones in this group. Price captured from the merchant.`;
  return `${base} Price captured from the merchant.`;
}

/**
 * Rank one family of sized products by price per unit.
 * value: furthest below the family's median price per unit.
 * cheap: lower total price, within the lower quarter of total prices.
 * refined: larger capacity first, then lower price per unit.
 */
export function rankUnitGroup(group: Product[], lane: Lane, locale: Locale): Recommendation[] {
  const per = new Map(group.map((p) => [p, unitPrice(p.price, p.spec)!]));
  const unitSorted = [...per.values()].sort((a, b) => a - b);
  const medianUnit = quartile(unitSorted, 0.5);
  const lowerUnit = quartile(unitSorted, 0.25);
  const upperUnit = quartile(unitSorted, 0.75);
  const totalSorted = group.map((p) => p.price).sort((a, b) => a - b);
  const lowerTotal = quartile(totalSorted, 0.25);
  const maxSize = Math.max(...group.map((p) => p.spec!.size!));

  const band = (v: number): Band => (v <= lowerUnit ? 'low' : v <= upperUnit ? 'mid' : 'high');
  const items: Recommendation[] = [];
  for (const product of group) {
    const v = per.get(product)!;
    if (lane === 'cheap' && product.price > lowerTotal) continue;
    const score =
      lane === 'value' ? 1 - v / medianUnit : lane === 'cheap' ? -product.price : product.spec!.size! / maxSize - (v / medianUnit) * 0.3;
    const reason = reasonFor(product, lane, v, medianUnit, locale);
    assertReasonAllowed(reason);
    items.push({ product, lane, score, band: band(v), reason, ranked: true });
  }
  return items;
}
