import { allVehicles, carResults, type CarPick } from '../cars';
import { vehiclesForQuery } from '../cars/query';
import { carReason } from '../cars/reason';
import { comparisonKey, search } from '../search';
import type { Locale, Recommendation } from '../types';

/** One numbered fact the model may use. `F1`, `F2`... are what it cites. */
export interface Fact {
  id: string;
  kind: 'product' | 'car' | 'note';
  /** Product or car id, for linking the answer back to a card. */
  ref?: string;
  url?: string;
  text: string;
}

export interface AskInput {
  question: string;
  locale: Locale;
  productId?: string;
  carId?: string;
}

const MAX_FACTS = 8;
const money = (n: number) => `$${Math.round(n).toLocaleString('en-NZ')}`;

function productFact(rec: Recommendation): Omit<Fact, 'id'> {
  const p = rec.product;
  const parts = [
    `${p.title}`,
    `price ${money(p.price)} at ${p.merchant}`,
    p.wasPrice ? `listed was-price ${money(p.wasPrice)}` : '',
    p.fixture ? 'SAMPLE DATA, not a live price' : `price captured ${p.capturedAt.slice(0, 10)}`,
    `our note: ${rec.reason}`,
  ].filter(Boolean);
  return { kind: 'product', ref: p.id, url: p.url, text: parts.join('; ') };
}

function carFact(pick: CarPick, locale: Locale): Omit<Fact, 'id'> {
  const c = pick.car;
  const parts = [
    `${c.year} ${c.make} ${c.model}${c.variant ? ` ${c.variant}` : ''}`,
    `asking ${money(c.priceNzd)} at ${c.dealer}${c.region ? ` (${c.region})` : ''}`,
    c.odometerKm !== undefined ? `${Math.round(c.odometerKm).toLocaleString('en-NZ')} km` : '',
    c.fuel ?? '',
    c.transmission ?? '',
    `our estimate ${money(pick.valuation.expected)}`,
    `price rank ${pick.cohort.rank} of ${pick.cohort.prices.length} comparable`,
    `listing read ${c.capturedAt.slice(0, 10)}`,
    `our note: ${carReason(pick, locale)}`,
  ].filter(Boolean);
  return { kind: 'car', ref: c.id, url: c.url, text: parts.join('; ') };
}

/**
 * Pick the facts for a question: the item asked about first, then the closest matches from
 * our own data. Nothing outside the site's data is ever added.
 */
export function factsFor(input: AskInput): Fact[] {
  const out: Omit<Fact, 'id'>[] = [];
  const carPool = carResults('refined').picks;

  // Asked from a card: that item, then only items it is actually compared with.
  if (input.productId) {
    const all = search('', 'value', input.locale).items;
    const rec = all.find((r) => r.product.id === input.productId);
    if (rec) {
      out.push(productFact(rec));
      const key = comparisonKey(rec.product);
      for (const peer of all.filter((r) => r.product.id !== rec.product.id && comparisonKey(r.product) === key).slice(0, 3)) out.push(productFact(peer));
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

  const products = search(input.question, 'value', input.locale).items.filter((r) => r.product.id !== input.productId).slice(0, 4);
  for (const rec of products) out.push(productFact(rec));

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
