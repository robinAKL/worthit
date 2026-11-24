import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from '../i18n';
import { appendSnapshots, readPrice } from './history';
import { describeHistory } from './historyView';

describe('price history', () => {
  it('keeps one point per day and drops days older than 90', () => {
    const first = appendSnapshots({}, [{ id: 'a', price: 100 }], '2026-01-01');
    const sameDay = appendSnapshots(first, [{ id: 'a', price: 90 }], '2026-01-01');
    expect(sameDay.a).toEqual([{ date: '2026-01-01', price: 90 }]);

    const aged = appendSnapshots(sameDay, [{ id: 'a', price: 80 }], '2026-04-02');
    expect(aged.a?.some((point) => point.date === '2026-01-01')).toBe(false);
    expect(aged.a).toEqual([{ date: '2026-04-02', price: 80 }]);
  });

  it('still reports a move before the window is long enough for a 30-day claim', () => {
    const points = [
      { date: '2026-11-01', price: 120 },
      { date: '2026-11-10', price: 100 },
      { date: '2026-11-24', price: 80 },
    ];
    const read = readPrice(points, '2026-11-24', 200);
    expect(read).toMatchObject({ low30: 80, median30: 100, change: 'down', suspiciousWas: false, atLow: false, covered: false });
    expect(readPrice(points, '2026-11-24', 120)?.suspiciousWas).toBe(false);
    expect(readPrice([{ date: '2026-11-24', price: 80 }], '2026-11-24')?.change).toBeUndefined();
  });

  it('withholds the 30-day low and a fake-discount flag until 28 days and 4 readings', () => {
    const today = '2026-11-24';
    const oneDay = readPrice([{ date: today, price: 80 }], today, 200);
    const tenDays = readPrice(
      [
        { date: '2026-11-14', price: 100 },
        { date: today, price: 80 },
      ],
      today,
      200,
    );
    const covered = readPrice(
      [
        { date: '2026-10-26', price: 120 },
        { date: '2026-11-05', price: 100 },
        { date: '2026-11-15', price: 90 },
        { date: today, price: 80 },
      ],
      today,
      200,
    );
    expect(oneDay).toMatchObject({ covered: false, atLow: false, suspiciousWas: false, change: undefined });
    expect(tenDays).toMatchObject({ covered: false, atLow: false, suspiciousWas: false, change: 'down' });
    expect(covered).toMatchObject({ covered: true, atLow: true, suspiciousWas: true, change: 'down', low30: 80 });
    expect(readPrice(covered ? [{ date: '2026-10-26', price: 120 }, { date: '2026-11-05', price: 200 }, { date: '2026-11-15', price: 90 }, { date: today, price: 80 }] : [], today, 200)?.suspiciousWas).toBe(false);
    const seenAbove = readPrice(
      [
        { date: '2026-10-26', price: 250 },
        { date: '2026-11-05', price: 100 },
        { date: '2026-11-15', price: 90 },
        { date: today, price: 80 },
      ],
      today,
      200,
    );
    expect(seenAbove?.suspiciousWas).toBe(false);

    const copy = DICTIONARIES['zh-Hans'].results.history;
    const money = (n: number) => `$${n}`;
    expect(describeHistory(oneDay!, 200, copy, money).join(' ')).toBe('价格自 11月24日 开始记录');
    expect(describeHistory(tenDays!, 200, copy, money).join(' ')).toContain('比上次记录低');
    expect(describeHistory(tenDays!, 200, copy, money).join(' ')).not.toContain('30 天');
    const full = describeHistory(covered!, 200, copy, money).join(' ');
    expect(full).toContain('现价是 30 天内的低点');
    expect(full).toContain('原价 $200 近 30 天未出现过');
  });
});
