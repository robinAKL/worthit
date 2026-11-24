import { allCarPicks, allVehicles, carResults, type CarPick } from '../cars';
import { vehiclesForQuery } from '../cars/query';
import { carReason } from '../cars/reason';
import { comparisonKey, search } from '../search';
import type { Locale, Recommendation } from '../types';
import { median } from '../deal';
import { unitPrice } from '../specs';
import { specTile } from '../specTile';

/** One numbered fact the model may use. `F1`, `F2`... are what it cites. */
export interface Fact {
  id: string;
  kind: 'product' | 'car' | 'note';
  /** Product or car id, for linking the answer back to a card. */
  ref?: string;
  url?: string;
  /** What the model reads: the same figures as `cells`, in the reader's language. */
  text: string;
  /** For the answer's table: a short name, then labelled cells. */
  title?: string;
  cells?: FactCell[];
}

export interface FactCell {
  label: string;
  value: string;
  /** Colours a difference: under the reference is good for the shopper. */
  tone?: 'good' | 'bad';
}

export interface AskInput {
  question: string;
  locale: Locale;
  productId?: string;
  carId?: string;
}

const MAX_FACTS = 8;
const money = (n: number) => `$${Math.round(n).toLocaleString('en-NZ')}`;

const LABEL = {
  en: {
    asking: 'Asking', price: 'Price', km: 'Kilometres', estimate: 'Our estimate', diff: 'Difference', seller: 'Seller', size: 'Size',
    perUnit: 'Per unit', typical: 'Typical in group', sample: 'SAMPLE DATA, not a live price', captured: 'Price read', read: 'Listing read', note: 'Our note',
    rank: 'Price rank', rankOf: (r: number, n: number) => `${r} of ${n} comparable`, under: 'under', over: 'over', was: 'was',
    basis: 'Compared with',
    sameModel: (n: number) => `${n} of the same model`,
    otherModels: (n: number) => `${n} other models of the same type (rough guide only)`,
    tooFew: 'too few similar cars (rough guide only)',
  },
  'zh-Hans': {
    asking: '标价', price: '价格', km: '公里数', estimate: '我们的估价', diff: '差额', seller: '卖家', size: '规格',
    perUnit: '每单位价', typical: '同组中位价', sample: '示例数据（SAMPLE DATA），不是在售价格', captured: '价格读取于', read: '信息读取于', note: '我们的说明',
    rank: '价格排名', rankOf: (r: number, n: number) => `可比 ${n} 个里第 ${r}`, under: '低于', over: '高于', was: '原价',
    basis: '比较对象',
    sameModel: (n: number) => `同款 ${n} 台`,
    otherModels: (n: number) => `其他车型的同类车 ${n} 台（仅供参考）`,
    tooFew: '相近的车太少（仅供参考）',
  },
} as const;

/** "$5,710 under (32%)": the difference between a price and its reference. */
function difference(price: number, reference: number, locale: Locale): FactCell {
  const L = LABEL[locale];
  const gap = reference - price;
  const pct = Math.round((Math.abs(gap) / reference) * 100);
  const word = gap >= 0 ? L.under : L.over;
  const value = locale === 'en' ? `${money(Math.abs(gap))} ${word} (${pct}%)` : `${word} ${money(Math.abs(gap))}（${pct}%）`;
  return { label: L.diff, value, tone: gap >= 0 ? 'good' : 'bad' };
}

function productFact(rec: Recommendation, group: Recommendation[], locale: Locale): Omit<Fact, 'id'> {
  const p = rec.product;
  const L = LABEL[locale];
  const unit = unitPrice(p.price, p.spec);
  const peers = group
    .map((r) => (unit !== undefined ? unitPrice(r.product.price, r.product.spec) : r.product.price))
    .filter((v): v is number => v !== undefined);
  const typical = peers.length >= 3 ? median(peers) : undefined;
  const per = (n: number) => `$${n.toFixed(n < 100 ? 2 : 0)}/${p.spec?.unit === 'place' ? 'set' : p.spec?.unit}`;
  const figure = specTile(p, locale).figure;
  const cells: FactCell[] = [{ label: L.price, value: money(p.price) }];
  if (figure) cells.push({ label: L.size, value: figure });
  if (unit !== undefined) cells.push({ label: L.perUnit, value: per(unit) });
  if (typical !== undefined) {
    cells.push({ label: L.typical, value: unit !== undefined ? per(typical) : money(typical) });
    cells.push(difference(p.price, unit !== undefined ? typical * p.spec!.size! : typical, locale));
  }
  cells.push({ label: L.seller, value: p.merchant });
  const title = p.titles?.[locale] ?? p.title;
  const text = [
    title,
    ...cells.map((c) => `${c.label} ${c.value}`),
    p.wasPrice ? `${L.was} ${money(p.wasPrice)}` : '',
    p.fixture ? L.sample : `${L.captured} ${p.capturedAt.slice(0, 10)}`,
    `${L.note}: ${rec.reason}`,
  ].filter(Boolean);
  return { kind: 'product', ref: p.id, url: p.url, title: p.fixture ? `${title} (${L.sample})` : title, cells, text: text.join('; ') };
}

function carFact(pick: CarPick, locale: Locale): Omit<Fact, 'id'> {
  const c = pick.car;
  const L = LABEL[locale];
  const cells: FactCell[] = [{ label: L.asking, value: money(c.priceNzd) }];
  if (c.odometerKm !== undefined) cells.push({ label: L.km, value: `${Math.round(c.odometerKm).toLocaleString('en-NZ')} km` });
  cells.push({ label: L.estimate, value: money(pick.valuation.expected) });
  cells.push(difference(c.priceNzd, pick.valuation.expected, locale));
  const peers = pick.cohort.prices.length - 1;
  const basis = pick.valuation.basis;
  cells.push({
    label: L.basis,
    value: basis === 'segment' ? L.otherModels(peers) : basis === 'pooled' || peers < 2 ? L.tooFew : L.sameModel(peers),
  });
  cells.push({ label: L.seller, value: `${c.dealer}${c.region ? ` (${c.region})` : ''}` });
  const title = `${c.year} ${c.make} ${c.model}${c.variant ? ` ${c.variant}` : ''}`;
  const text = [
    title,
    ...cells.map((cell) => `${cell.label} ${cell.value}`),
    c.fuel ?? '',
    c.transmission ?? '',
    `${L.rank} ${L.rankOf(pick.cohort.rank, pick.cohort.prices.length)}`,
    `${L.read} ${c.capturedAt.slice(0, 10)}`,
    `${L.note}: ${carReason(pick, locale)}`,
  ].filter(Boolean);
  return { kind: 'car', ref: c.id, url: c.url, title: `${c.year} ${c.make} ${c.model}`, cells, text: text.join('; ') };
}

/**
 * Pick the facts for a question: the item asked about first, then the closest matches from
 * our own data. Nothing outside the site's data is ever added.
 */
export function factsFor(input: AskInput): Fact[] {
  const out: Omit<Fact, 'id'>[] = [];
  const carPool = allCarPicks();

  // Asked from a card: that item, then only items it is actually compared with.
  if (input.productId) {
    const all = search('', 'value', input.locale).items;
    const rec = all.find((r) => r.product.id === input.productId);
    if (rec) {
      const key = comparisonKey(rec.product);
      const group = all.filter((r) => comparisonKey(r.product) === key);
      out.push(productFact(rec, group, input.locale));
      for (const peer of group.filter((r) => r.product.id !== rec.product.id).slice(0, 3)) out.push(productFact(peer, group, input.locale));
    }
    return number(out);
  }
  if (input.carId) {
    const pick = carPool.find((p) => p.car.id === input.carId);
    if (pick) {
      out.push(carFact(pick, input.locale));
      const peers = carResults('value').picks.filter((p) => p.car.modelKey === pick.car.modelKey && p.car.id !== pick.car.id).slice(0, 3);
      for (const peer of peers) out.push(carFact(peer, input.locale));
    }
    return number(out);
  }

  const found = search(input.question, 'value', input.locale).items;
  for (const rec of found.slice(0, 4)) {
    const key = comparisonKey(rec.product);
    out.push(productFact(rec, found.filter((r) => comparisonKey(r.product) === key), input.locale));
  }

  const vehicles = vehiclesForQuery(input.question, allVehicles());
  if (vehicles && vehicles.length > 0) {
    const ids = new Set(vehicles.map((v) => v.id));
    const picks = carResults('value').picks.filter((p) => ids.has(p.car.id) && p.car.id !== input.carId).slice(0, 4);
    for (const pick of picks) out.push(carFact(pick, input.locale));
  }

  return number(out);
}

function number(facts: Omit<Fact, 'id'>[]): Fact[] {
  return facts.slice(0, MAX_FACTS).map((f, i) => ({ ...f, id: `F${i + 1}` }));
}
