import { describe, expect, it } from 'vitest';
import { isComparableGroup, placeMarkFor } from './cohort';

describe('rank marks on mixed groups', () => {
  it('shows no 第 1 / No. 1 when prices spread more than 3x', () => {
    const mixed = [150, 350, 800, 1400, 2200, 2400];
    expect(isComparableGroup(mixed)).toBe(false);
    expect(placeMarkFor(isComparableGroup(mixed), 1, (n) => `第 ${n}`)).toBeUndefined();
    expect(placeMarkFor(isComparableGroup(mixed), 1, (n) => `No. ${n}`)).toBeUndefined();
  });

  it('marks the first place when the group is tight', () => {
    const tight = [900, 950, 1000, 1050, 1100];
    expect(isComparableGroup(tight)).toBe(true);
    expect(placeMarkFor(true, 1, (n) => `No. ${n}`)).toBe('No. 1');
  });
});
