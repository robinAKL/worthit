import type { Locale } from '../types';
import { CHEAP_MAX_KM, CHEAP_MIN_YEAR, MAX_OVER_FAIR, type CarPick } from './model';

/**
 * One sentence per car, built only from that car's own fields and its valuation.
 * A field the dealer did not state is left out, never written as zero.
 */
export function carReason(pick: CarPick, locale: Locale): string {
  const { car, valuation: v, lane } = pick;
  const nzd = (n: number) => `$${Math.round(n).toLocaleString('en-NZ')}`;
  const pct = Math.round(Math.abs(v.gap) * 100);
  const km = car.odometerKm !== undefined ? Math.round(car.odometerKm).toLocaleString('en-NZ') : undefined;
  const name = `${car.make} ${car.model}`;
  const peers = pick.cohort.prices.length - 1;
  const [from, to] = pick.cohort.years ?? [car.year, car.year];

  if (locale === 'zh-Hans') {
    const basis =
      pick.cohort.kind === 'model'
        ? `和在售的 ${peers} 台 ${from}–${to} 年 ${name} 比较，每台都按这台的车龄和公里数校正，合理价约 ${nzd(v.expected)}`
        : pick.cohort.kind === 'segment'
          ? `同款在售太少，改和 ${peers} 台 ${from}–${to} 年的同类车比较（已按车龄和公里数校正），合理价约 ${nzd(v.expected)}`
          : `在售的相近车太少，只能按 ${v.sample} 台在售车的整体规律粗估，约 ${nzd(v.expected)}`;
    const cmp = pct < 1 ? '标价与估算基本持平。' : v.gap < 0 ? `标价 ${nzd(car.priceNzd)}，低 ${pct}%。` : `标价 ${nzd(car.priceNzd)}，高 ${pct}%。`;
    if (lane === 'value') return `${basis}；${cmp}`;
    if (lane === 'cheap')
      return `通过了最低门槛（${CHEAP_MIN_YEAR} 年以后、${CHEAP_MAX_KM / 10_000} 万公里以内、标价不高于合理价 ${Math.round(MAX_OVER_FAIR * 100)}%）。标价 ${nzd(car.priceNzd)}，${car.year} 年${km ? `，${km} 公里` : ''}。${basis}。`;
    const drive = car.fuelClass === 'hybrid' ? '混动' : car.fuelClass === 'plugin' ? '插电混动' : car.fuelClass === 'electric' ? '纯电' : '';
    return `${car.year} 年${km ? `、${km} 公里` : ''}${drive ? `、${drive}` : ''}，车龄和公里数在同类车里排前三分之一，标价不高于合理价 ${Math.round(MAX_OVER_FAIR * 100)}%。${cmp}`;
  }

  const basis =
    pick.cohort.kind === 'model'
      ? `Fair price about ${nzd(v.expected)}, from ${peers} ${name}s from ${from}–${to} on sale, each adjusted to this car's age and kilometres`
      : pick.cohort.kind === 'segment'
        ? `Too few ${name}s on sale, so compared with ${peers} similar cars from ${from}–${to}, adjusted for age and kilometres: fair price about ${nzd(v.expected)}`
        : `Too few similar cars on sale; a rough estimate of ${nzd(v.expected)} from the overall pattern of ${v.sample} cars`;
  const cmp = pct < 1 ? 'The asking price is about the same.' : v.gap < 0 ? `Asking ${nzd(car.priceNzd)}, ${pct}% below.` : `Asking ${nzd(car.priceNzd)}, ${pct}% above.`;
  if (lane === 'value') return `${basis}. ${cmp}`;
  if (lane === 'cheap')
    return `Passes the floor (${CHEAP_MIN_YEAR} or newer, under ${(CHEAP_MAX_KM / 1000).toLocaleString('en-NZ')},000 km, no more than ${Math.round(MAX_OVER_FAIR * 100)}% over its fair price). Asking ${nzd(car.priceNzd)}, ${car.year}${km ? `, ${km} km` : ''}. ${basis}.`;
  const drive = car.fuelClass === 'hybrid' ? ', hybrid' : car.fuelClass === 'plugin' ? ', plug-in hybrid' : car.fuelClass === 'electric' ? ', electric' : '';
  return `${car.year}${km ? `, ${km} km` : ''}${drive}. In the top third of similar cars on age and kilometres, and no more than ${Math.round(MAX_OVER_FAIR * 100)}% over its fair price. ${cmp}`;
}
