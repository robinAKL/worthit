import type { Locale } from '../types';
import type { CarPick } from './model';

/**
 * One sentence per car, built only from that car's own fields and its valuation.
 * A field the dealer did not state is left out, never written as zero.
 */
export function carReason(pick: CarPick, locale: Locale): string {
  const { car, valuation: v, lane, priceRank, valued: total } = pick;
  const nzd = (n: number) => `$${Math.round(n).toLocaleString('en-NZ')}`;
  const pct = Math.round(Math.abs(v.gap) * 100);
  const km = car.odometerKm !== undefined ? Math.round(car.odometerKm).toLocaleString('en-NZ') : undefined;
  const group = v.groupSize > 0;
  const name = `${car.make} ${car.model}`;

  if (locale === 'zh-Hans') {
    const basis = group
      ? `按 ${v.sample} 台在售车的年份、里程、车身估算，并参考同款 ${name} 的 ${v.groupSize} 台在售价，这台约值 ${nzd(v.expected)}`
      : `按 ${v.sample} 台在售车的年份、里程、车身估算，这台约值 ${nzd(v.expected)}`;
    const cmp = pct < 1 ? '标价与估算基本持平。' : v.gap < 0 ? `标价 ${nzd(car.priceNzd)}，低 ${pct}%。` : `标价 ${nzd(car.priceNzd)}，高 ${pct}%。`;
    if (lane === 'value') return `${basis}；${cmp}`;
    if (lane === 'cheap') return `标价 ${nzd(car.priceNzd)}，在 ${total} 台可比车里第 ${priceRank} 便宜；${car.year} 年${km ? `，${km} 公里` : ''}。${basis}。`;
    const drive = car.fuelClass === 'hybrid' ? '混动' : car.fuelClass === 'plugin' ? '插电混动' : car.fuelClass === 'electric' ? '纯电' : '';
    return `${car.year} 年${km ? `、${km} 公里` : ''}${drive ? `、${drive}` : ''}，在可比车里车龄和里程都靠前。${cmp}`;
  }

  const basis = group
    ? `Estimated at ${nzd(v.expected)} from the year, kilometres and body of ${v.sample} cars for sale, adjusted by ${v.groupSize} ${name}s on sale`
    : `Estimated at ${nzd(v.expected)} from the year, kilometres and body of ${v.sample} cars for sale`;
  const cmp = pct < 1 ? 'The asking price is about the same.' : v.gap < 0 ? `Asking ${nzd(car.priceNzd)}, ${pct}% below.` : `Asking ${nzd(car.priceNzd)}, ${pct}% above.`;
  if (lane === 'value') return `${basis}. ${cmp}`;
  if (lane === 'cheap') return `Asking ${nzd(car.priceNzd)}, number ${priceRank} by price of ${total} comparable cars. ${car.year}${km ? `, ${km} km` : ''}. ${basis}.`;
  const drive = car.fuelClass === 'hybrid' ? ', hybrid' : car.fuelClass === 'plugin' ? ', plug-in hybrid' : car.fuelClass === 'electric' ? ', electric' : '';
  return `${car.year}${km ? `, ${km} km` : ''}${drive}. Among the newest and lowest-kilometre cars we compared. ${cmp}`;
}
