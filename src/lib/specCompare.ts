import { assertReasonAllowed, CHEAP_FLOOR, inSpecPriceBand, isAccessory, quartile, specPoints } from './score';
import { FAMILY_UNIT, sizeBand, unitPrice, type ProductSpec, type Unit } from './specs';
import type { Band, Lane, Locale, Product, Recommendation } from './types';

/** Families compared per unit need at least this many sized items to rank. */
export const MIN_UNIT_GROUP = 5;

const FAMILY_NAME: Record<Locale, Record<string, string>> = {
  en: { fridge: 'fridges', freezer: 'freezers', washer: 'washers', dryer: 'dryers', microwave: 'microwaves', dishwasher: 'dishwashers', oven: 'ovens', laptop: 'laptops' },
  'zh-Hans': { fridge: '冰箱', freezer: '冷柜', washer: '洗衣机', dryer: '干衣机', microwave: '微波炉', dishwasher: '洗碗机', oven: '烤箱', laptop: '笔记本' },
};
export const UNIT_NAME: Record<Locale, Record<Unit, string>> = {
  en: { L: 'litre', kg: 'kg', place: 'place setting' },
  'zh-Hans': { L: '升', kg: '公斤', place: '套' },
};
const SIZE_LABEL: Record<Locale, (size: number, unit: Unit) => string> = {
  en: (size, unit) => (unit === 'L' ? `${size} L` : unit === 'kg' ? `${size} kg` : `${size} place settings`),
  'zh-Hans': (size, unit) => `${size} ${UNIT_NAME['zh-Hans'][unit]}`,
};

const BAND_LABEL: Record<Locale, Record<string, string>> = {
  en: { compact: 'under 200 L', mid: '200–449 L', large: '450 L and over', small: 'under 9 kg', big: '9 kg and over' },
  'zh-Hans': { compact: '200 升以下', mid: '200–449 升', large: '450 升及以上', small: '9 公斤以下', big: '9 公斤及以上' },
};

/** A washer's "large" band is labelled differently from a fridge's. */
function bandKey(spec: ProductSpec, band: string): string {
  return spec.family === 'washer' && band === 'large' ? 'big' : band;
}

/** The group a sized item is compared with: its size band when that band has enough items, else the whole family. */
export function peersFor<T extends Product>(product: T, group: T[]): { peers: T[]; band?: string } {
  const band = product.spec ? sizeBand(product.spec) : undefined;
  if (band) {
    const same = group.filter((p) => p.spec && sizeBand(p.spec) === band);
    if (same.length >= MIN_UNIT_GROUP) return { peers: same, band: bandKey(product.spec!, band) };
  }
  return { peers: group };
}

export function bandLabel(band: string, locale: Locale): string {
  return BAND_LABEL[locale][band] ?? band;
}

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

function reasonFor(product: Product, lane: Lane, perUnit: number, medianPerUnit: number, locale: Locale, band?: string): string {
  const spec = product.spec!;
  const unit = spec.unit!;
  const size = sizeLabel(spec.size!, unit, locale);
  // "fridges 450 L and over" in English, "450 升及以上的冰箱" in Chinese.
  const fam = !band
    ? familyName(spec.family, locale)
    : locale === 'zh-Hans'
      ? `${bandLabel(band, locale)}的${familyName(spec.family, locale)}`
      : `${familyName(spec.family, locale)} ${bandLabel(band, locale)}`;
  const price = money(Math.round(product.price));
  if (locale === 'zh-Hans') {
    const base = `${size}，标价 ${price}，每${UNIT_NAME['zh-Hans'][unit]} ${money(perUnit)}；同类${fam}每${UNIT_NAME['zh-Hans'][unit]}中位 ${money(medianPerUnit)}。`;
    if (lane === 'refined') return `${base}价格和同类相近，容量和其他可比较的规格更高。这是采集到的商家标价。`;
    return `${base}这是采集到的商家标价。`;
  }
  const base = `${size} for ${price}, ${money(perUnit)} per ${UNIT_NAME.en[unit]}. Similar ${fam}: ${money(medianPerUnit)} per ${UNIT_NAME.en[unit]} at the median.`;
  if (lane === 'refined') return `${base} Priced like the others, with more capacity or measurable spec. Price captured from the merchant.`;
  return `${base} Price captured from the merchant.`;
}

/**
 * Rank one family of sized products by price per unit.
 * value: furthest below the family's median price per unit.
 * cheap: lower total price, within the lower quarter of total prices.
 * refined ("Higher spec"): items priced within 25% of the group's median total price, more measurable spec first.
 */
export function rankUnitGroup(group: Product[], lane: Lane, locale: Locale): Recommendation[] {
  const per = new Map(group.map((p) => [p, unitPrice(p.price, p.spec)!]));
  const totalSorted = group.map((p) => p.price).sort((a, b) => a - b);
  const lowerTotal = quartile(totalSorted, 0.25);
  const items: Recommendation[] = [];
  for (const product of group) {
    // Compare with the same size band when it has enough items, so a bar fridge is not judged against 650 L ones.
    const { peers, band } = peersFor(product, group);
    const unitSorted = peers.map((p) => per.get(p)!).sort((a, b) => a - b);
    const medianUnit = quartile(unitSorted, 0.5);
    const lowerUnit = quartile(unitSorted, 0.25);
    const upperUnit = quartile(unitSorted, 0.75);
    const maxSize = Math.max(...peers.map((p) => p.spec!.size!));
    const v = per.get(product)!;
    if (lane === 'cheap' && product.price > lowerTotal) continue;
    if (lane === 'cheap' && /out of stock/i.test(String(product.specs.stock ?? ''))) continue;
    if (lane === 'cheap' && (isAccessory(product.title) || product.price < quartile(totalSorted, 0.5) * (1 - CHEAP_FLOOR))) continue;
    // Higher spec: only against items priced like this one, then more measurable spec first.
    const peerMedianTotal = quartile(peers.map((p) => p.price).sort((a, b) => a - b), 0.5);
    if (lane === 'refined' && !inSpecPriceBand(product.price, peerMedianTotal)) continue;
    const score =
      lane === 'value'
        ? 1 - v / medianUnit
        : lane === 'cheap'
          ? -product.price
          : specPoints(product, maxSize) - (v / medianUnit) * 0.001;
    const reason = reasonFor(product, lane, v, medianUnit, locale, band);
    assertReasonAllowed(reason);
    const bandOf = (x: number): Band => (x <= lowerUnit ? 'low' : x <= upperUnit ? 'mid' : 'high');
    items.push({ product, lane, score, band: bandOf(v), reason, ranked: true, cohortPrices: unitSorted, cohortBand: band });
  }
  return items;
}
