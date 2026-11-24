import { confidenceFrom, priceRankIn, type Cohort, type Confidence } from '../deal';
import type { Fuel, Lane, Vehicle } from '../types';

/**
 * Used-car valuation for WorthIt.
 *
 * 1. One explainable model over every car on sale we collected:
 *      log(price) ≈ b0 + b1·age + b2·age² + b3·km + body + fuel class + premium + premium·age + make
 *    fitted by least squares (small ridge for stability). premium·age lets premium brands
 *    lose value faster, so an old BMW is not valued like a newer one.
 * 2. Each car is then compared with its closest set of cars on sale (see `comparableSet`):
 *    the same make and model within two years and the same fuel, widening step by step.
 *    Every peer's price is adjusted to this car's age and kilometres with the model's slopes.
 *    The fair price is the median of those adjusted prices, and the card's rank is this car's
 *    place among the same adjusted prices, so the two can never disagree.
 *
 * Nothing here invents data: a car without year, price or kilometres is not ranked.
 */

export const MIN_GROUP = 5;
export const CHEAP_MAX_KM = 250_000;
export const CHEAP_MIN_YEAR = 2005;
/**
 * A car priced more than this far below its estimate is left out of the Value lane: the model
 * cannot see trim, cab style or condition, so a gap that large is more often a mismatch than a bargain.
 */
export const VALUE_MAX_GAP = 0.35;

export type BodyClass = 'hatch' | 'sedan' | 'wagon' | 'suv' | 'ute' | 'van' | 'coupe' | 'other';
export type FuelClass = 'petrol' | 'diesel' | 'hybrid' | 'plugin' | 'electric';

export interface Car extends Vehicle {
  bodyClass: BodyClass;
  fuelClass: FuelClass;
  premium: boolean;
  /** Lowercase make + model, used for same-model groups. */
  modelKey: string;
}

export interface Valuation {
  /** Estimated asking price for this car, NZD, rounded to $100. */
  expected: number;
  /** price / expected - 1. Negative means below the estimate. */
  gap: number;
  /** Cars that fed the pooled model. */
  sample: number;
  /** Same-model cars in the comparable set, including this one (0 when the set is not same-model). */
  groupSize: number;
  /** Which comparable set the fair price came from. */
  basis: Basis;
}

/**
 * model-near: same make+model, within 2 years, same fuel. model-wide: same make+model within 3 years.
 * model-any: same make+model, any year. model-few: only 2-3 other cars of the same model within
 * 3 years; good enough for a fair price and a rank, but too few for a value claim.
 * segment: same body and brand tier within 2 years.
 * pooled: nothing close enough; the pooled model alone, and the car is not ranked for value.
 */
export type Basis = 'model-near' | 'model-wide' | 'model-any' | 'model-few' | 'segment' | 'pooled';

export interface CarPick {
  car: Car;
  lane: Lane;
  score: number;
  valuation: Valuation;
  /** 1-based price rank among all valued cars, cheapest first. */
  priceRank: number;
  /** How many cars were valued (the population behind priceRank). */
  valued: number;
  /** Comparable cars on sale: same make and model when there are 3 or more, else same body and nearby years. */
  cohort: Cohort;
  /** How firm the estimate is: same-model cars behind it, else make support. */
  confidence: Confidence;
}

const PREMIUM = new Set(['bmw', 'mercedes-benz', 'audi', 'lexus', 'volvo', 'land rover', 'porsche', 'jaguar', 'mini', 'tesla', 'genesis']);

export function bodyClass(body?: string): BodyClass {
  const b = String(body ?? '').toLowerCase();
  if (/hatch/.test(b)) return 'hatch';
  if (/sedan|saloon/.test(b)) return 'sedan';
  if (/wagon|estate/.test(b)) return 'wagon';
  if (/suv|4wd|crossover/.test(b)) return 'suv';
  if (/ute|pick ?up|cab/.test(b)) return 'ute';
  if (/van|people mover|minivan|mpv/.test(b)) return 'van';
  if (/coupe|convertible|cabrio/.test(b)) return 'coupe';
  return 'other';
}

export function fuelClass(fuel?: Fuel): FuelClass {
  if (fuel === 'hybrid') return 'hybrid';
  if (fuel === 'plug-in-hybrid') return 'plugin';
  if (fuel === 'electric') return 'electric';
  if (fuel === 'diesel') return 'diesel';
  return 'petrol';
}

/** Fix the common dealer quirk "Mercedes Benz C200" -> make "Mercedes-Benz", model "C200". */
function normaliseNames(v: Vehicle): { make: string; model: string; variant?: string } {
  let make = v.make.trim();
  let model = v.model.trim();
  let variant = v.variant?.trim();
  if (/^mercedes$/i.test(make) && /^benz$/i.test(model)) {
    make = 'Mercedes-Benz';
    const [first, ...rest] = (variant ?? '').split(' ');
    model = first || model;
    variant = rest.join(' ') || undefined;
  }
  if (/^mercedes$/i.test(make)) make = 'Mercedes-Benz';
  return { make, model, variant };
}

/** A brand-new car is not a used car: a "-new" stock URL, or this year's model with under 500 km. */
export function looksNew(v: Vehicle, nowYear = new Date().getFullYear()): boolean {
  let path = '';
  try {
    path = new URL(v.url).pathname.replace(/\/$/, '');
  } catch {
    /* keep empty */
  }
  return /-new$/i.test(path) || (v.year >= nowYear && (v.odometerKm ?? Infinity) < 500);
}

export function toCar(v: Vehicle, nowYear = new Date().getFullYear()): Car | null {
  if (!v.make || !v.model || !Number.isInteger(v.year) || !(v.priceNzd > 0)) return null;
  if (looksNew(v, nowYear)) return null;
  const names = normaliseNames(v);
  const bc = bodyClass(v.body);
  if (/motor ?bike|motorcycle|scooter/i.test(v.body ?? '')) return null;
  // A page that shows "2021" in the odometer field for a 2021 car is the year read twice, not 2,021 km.
  const odometerKm = v.odometerKm === v.year ? undefined : v.odometerKm;
  return {
    ...v,
    odometerKm,
    ...names,
    bodyClass: bc,
    fuelClass: fuelClass(v.fuel),
    premium: PREMIUM.has(names.make.toLowerCase()),
    modelKey: `${names.make} ${names.model}`.toLowerCase(),
  };
}

/** One car per vehicle across dealers: dedupeKey first, then make+model+year+km. Cheapest listing wins. */
export function dedupe(cars: Car[]): Car[] {
  const byKey = new Map<string, Car>();
  for (const car of cars) {
    const key = car.dedupeKey ?? `${car.modelKey}|${car.year}|${car.odometerKm ?? 'x'}`;
    const prev = byKey.get(key);
    if (!prev || car.priceNzd < prev.priceNzd) byKey.set(key, car);
  }
  return [...byKey.values()];
}

// ---------- pooled log-price model ----------

const BODY_TERMS: BodyClass[] = ['sedan', 'wagon', 'suv', 'ute', 'van', 'coupe', 'other'];
const FUEL_TERMS: FuelClass[] = ['diesel', 'hybrid', 'plugin', 'electric'];

/** A make gets its own term once it has this many cars; rarer makes share the base level. */
export const MIN_MAKE = 4;

function features(car: Car, nowYear: number, makes: string[]): number[] {
  const age = Math.max(0, nowYear - car.year);
  const km10k = (car.odometerKm ?? 0) / 10_000;
  const make = car.make.toLowerCase();
  return [
    1,
    age,
    age * age,
    km10k,
    ...BODY_TERMS.map((b) => (car.bodyClass === b ? 1 : 0)),
    ...FUEL_TERMS.map((f) => (car.fuelClass === f ? 1 : 0)),
    car.premium ? 1 : 0,
    car.premium ? age : 0,
    car.premium ? age * age : 0,
    ...makes.map((m) => (make === m ? 1 : 0)),
  ];
}
const KM_INDEX = 3;

/** Solve (XᵀX + λI)β = Xᵀy by Gaussian elimination. The intercept is not penalised. */
function ridge(X: number[][], y: number[], lambda = 0.5): number[] {
  const p = X[0].length;
  const A = Array.from({ length: p }, () => new Array<number>(p + 1).fill(0));
  for (let r = 0; r < X.length; r++) {
    for (let i = 0; i < p; i++) {
      A[i][p] += X[r][i] * y[r];
      for (let j = 0; j < p; j++) A[i][j] += X[r][i] * X[r][j];
    }
  }
  for (let i = 1; i < p; i++) A[i][i] += lambda;
  for (let c = 0; c < p; c++) {
    let pivot = c;
    for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[pivot][c])) pivot = r;
    [A[c], A[pivot]] = [A[pivot], A[c]];
    const d = A[c][c] || 1e-12;
    for (let r = 0; r < p; r++) {
      if (r === c) continue;
      const f = A[r][c] / d;
      for (let k = c; k <= p; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[p] / (A[i][i] || 1e-12));
}

export interface PriceModel {
  beta: number[];
  nowYear: number;
  sample: number;
  /** Makes with their own term (lowercase). */
  makes: string[];
  predictLog(car: Car): number;
}

export function fitModel(cars: Car[], nowYear: number): PriceModel {
  const usable = cars.filter((c) => c.odometerKm !== undefined);
  const counts = new Map<string, number>();
  for (const c of usable) counts.set(c.make.toLowerCase(), (counts.get(c.make.toLowerCase()) ?? 0) + 1);
  const makes = [...counts].filter(([, n]) => n >= MIN_MAKE).map(([m]) => m).sort();
  const X = usable.map((c) => features(c, nowYear, makes));
  const y = usable.map((c) => Math.log(c.priceNzd));
  const width = 4 + BODY_TERMS.length + FUEL_TERMS.length + 3 + makes.length;
  const beta = usable.length >= 20 ? ridge(X, y) : [Math.log(median(usable.map((c) => c.priceNzd)) || 1), ...new Array(width - 1).fill(0)];
  // More kilometres must never raise the estimate. If the data says otherwise, drop the term.
  if (beta[KM_INDEX] > 0) beta[KM_INDEX] = 0;
  const predictLog = (car: Car) => features(car, nowYear, makes).reduce((s, x, i) => s + x * (beta[i] ?? 0), 0);
  return { beta, nowYear, sample: usable.length, makes, predictLog };
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface Comparable {
  basis: Basis;
  /** Other cars in the set (never the car itself). */
  peers: Car[];
  /** Model years the set covers. */
  years?: [number, number];
}

/** The closest set of cars on sale to compare with, widening only when there are too few. */
export function comparableSet(car: Car, pool: Car[]): Comparable {
  const need = MIN_GROUP - 1;
  const others = pool.filter((p) => p.id !== car.id);
  const same = others.filter((p) => p.modelKey === car.modelKey);
  const near = same.filter((p) => Math.abs(p.year - car.year) <= 2 && p.fuelClass === car.fuelClass);
  if (near.length >= need) return { basis: 'model-near', peers: near, years: [car.year - 2, car.year + 2] };
  const wide = same.filter((p) => Math.abs(p.year - car.year) <= 3);
  if (wide.length >= need) return { basis: 'model-wide', peers: wide, years: [car.year - 3, car.year + 3] };
  if (same.length >= need) {
    const years = [car.year, ...same.map((p) => p.year)];
    return { basis: 'model-any', peers: same, years: [Math.min(...years), Math.max(...years)] };
  }
  if (wide.length >= 2) return { basis: 'model-few', peers: wide, years: [car.year - 3, car.year + 3] };
  const segment = others.filter((p) => p.bodyClass === car.bodyClass && p.premium === car.premium && Math.abs(p.year - car.year) <= 2);
  if (segment.length >= need) return { basis: 'segment', peers: segment, years: [car.year - 2, car.year + 2] };
  return { basis: 'pooled', peers: [] };
}

/** A peer's asking price moved to this car's age and kilometres, using the model's slopes. */
export function adjustedPrice(peer: Car, car: Car, model: PriceModel): number {
  return peer.priceNzd * Math.exp(model.predictLog(car) - model.predictLog(peer));
}

export interface Assessment {
  valuation: Valuation;
  comparable: Comparable;
  /** Peers' adjusted prices plus this car's own price, sorted. Empty when pooled. */
  prices: number[];
}

/** Fair price and comparable set for every car with kilometres. */
export function valueAll(cars: Car[], model: PriceModel): Map<string, Assessment> {
  const usable = cars.filter((c) => c.odometerKm !== undefined);
  const out = new Map<string, Assessment>();
  for (const car of usable) {
    const comparable = comparableSet(car, usable);
    const adjusted = comparable.peers.map((p) => adjustedPrice(p, car, model));
    const fair = adjusted.length > 0 ? median(adjusted) : Math.exp(model.predictLog(car));
    const expected = Math.round(fair / 100) * 100;
    const sameModel = comparable.basis.startsWith('model');
    out.set(car.id, {
      valuation: { expected, gap: car.priceNzd / expected - 1, sample: model.sample, groupSize: sameModel ? comparable.peers.length + 1 : 0, basis: comparable.basis },
      comparable,
      prices: adjusted.length > 0 ? [...adjusted, car.priceNzd].sort((a, b) => a - b) : [],
    });
  }
  return out;
}

// ---------- lanes ----------

export function rankCars(all: Vehicle[], lane: Lane, nowYear = new Date().getFullYear()): CarPick[] {
  const cars = dedupe(all.map((v) => toCar(v, nowYear)).filter((c): c is Car => c !== null));
  const model = fitModel(cars, nowYear);
  const assessed = valueAll(cars, model);
  const values = new Map([...assessed].map(([id, a]) => [id, a.valuation]));
  const ranked = cars.filter((c) => values.has(c.id));
  const byPrice = [...ranked].sort((a, b) => a.priceNzd - b.priceNzd);
  const priceRank = new Map(byPrice.map((c, i) => [c.id, i + 1]));

  // The card's rank uses the same comparable set as the fair price: peers adjusted to this car's age and km.
  const cohortOf = (c: Car): Cohort => {
    const a = assessed.get(c.id)!;
    const { basis, years } = a.comparable;
    if (basis === 'pooled') return { kind: 'none', label: `${c.make} ${c.model}`, prices: [c.priceNzd], rank: 1 };
    const kind = basis === 'segment' ? 'segment' : 'model';
    return {
      kind,
      label: kind === 'model' ? `${c.make} ${c.model}` : c.bodyClass,
      prices: a.prices,
      rank: priceRankIn(a.prices, c.priceNzd),
      years,
      adjusted: true,
    };
  };
  const confidenceOf = (c: Car): Confidence => {
    const { basis, peers } = assessed.get(c.id)!.comparable;
    if (basis === 'model-near' || basis === 'model-wide') return confidenceFrom(peers.length + 1);
    if (basis === 'model-any' || basis === 'segment') return Math.min(2, confidenceFrom(peers.length + 1)) as Confidence;
    if (basis === 'model-few') return 1;
    return 1;
  };
  const score = (c: Car): number | null => {
    const v = values.get(c.id)!;
    // A value claim needs a comparable set behind the estimate, and a gap small enough to be believable.
    if (lane === 'value') {
      if (v.gap < -VALUE_MAX_GAP) return null;
      // Too few similar cars for a value claim: still listed, after every car we can judge.
      return v.basis === 'pooled' || v.basis === 'model-few' ? -10 - v.gap : -v.gap;
    }
    if (lane === 'cheap') {
      if ((c.odometerKm ?? Infinity) > CHEAP_MAX_KM || c.year < CHEAP_MIN_YEAR) return null;
      return -c.priceNzd;
    }
    // refined: newer, fewer kilometres, electrified drivetrains first. Price does not count.
    const age = Math.max(0, nowYear - c.year);
    const electrified = c.fuelClass === 'hybrid' || c.fuelClass === 'plugin' || c.fuelClass === 'electric' ? 1.5 : 0;
    return -age - (c.odometerKm ?? 0) / 30_000 + electrified;
  };

  return ranked
    .map((car) => ({ car, s: score(car) }))
    .filter((x): x is { car: Car; s: number } => x.s !== null)
    .sort((a, b) => b.s - a.s)
    .map(({ car, s }) => ({ car, lane, score: s, valuation: values.get(car.id)!, priceRank: priceRank.get(car.id)!, valued: ranked.length, cohort: cohortOf(car), confidence: confidenceOf(car) }));
}
