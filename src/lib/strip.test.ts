import { describe, expect, it } from 'vitest';
import { stripLayout } from './strip';

describe('price strip', () => {
  it('places the item and the reference on the same min–max line', () => {
    const layout = stripLayout([8000, 10000, 14000], 10000, 11000);
    expect(layout).toMatchObject({ low: 8000, high: 14000 });
    expect(layout!.valueAt).toBeCloseTo((2000 / 6000) * 100);
    expect(layout!.markerAt).toBeCloseTo((3000 / 6000) * 100);
  });

  it('drops the reference mark when the group is too mixed to call one price typical', () => {
    const layout = stripLayout([100, 400], 100);
    expect(layout!.markerAt).toBeUndefined();
    expect(layout!.valueAt).toBe(0);
  });

  it('sits in the middle when every price is the same', () => {
    expect(stripLayout([50, 50], 50, 50)).toMatchObject({ valueAt: 50, markerAt: 50 });
  });
});
