import { describe, expect, it } from 'vitest';
import { appendSnapshots, readPrice } from './history';

describe('price history', () => {
  it('keeps one point per day and drops days older than 90', () => {
    const first = appendSnapshots({}, [{ id: 'a', price: 100 }], '2026-01-01');
    const sameDay = appendSnapshots(first, [{ id: 'a', price: 90 }], '2026-01-01');
    expect(sameDay.a).toEqual([{ date: '2026-01-01', price: 90 }]);

    const aged = appendSnapshots(sameDay, [{ id: 'a', price: 80 }], '2026-04-02');
    expect(aged.a?.some((point) => point.date === '2026-01-01')).toBe(false);
    expect(aged.a).toEqual([{ date: '2026-04-02', price: 80 }]);
  });

  it('reads the 30-day low, the median, the move, and a previous price that never occurred', () => {
    const points = [
      { date: '2026-11-01', price: 120 },
      { date: '2026-11-10', price: 100 },
      { date: '2026-11-24', price: 80 },
    ];
    const read = readPrice(points, '2026-11-24', 200);
    expect(read).toMatchObject({ low30: 80, median30: 100, change: 'down', suspiciousWas: true, atLow: true });
    expect(readPrice(points, '2026-11-24', 120)?.suspiciousWas).toBe(false);
    expect(readPrice([{ date: '2026-11-24', price: 80 }], '2026-11-24')?.change).toBeUndefined();
  });
});
