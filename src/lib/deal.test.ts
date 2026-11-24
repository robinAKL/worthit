import { describe, expect, it } from 'vitest';
import { confidenceFrom, dealTier, median, priceRankIn, savings } from './deal';

describe('deal tiers', () => {
  it('puts each gap in the right tier, edges included', () => {
    expect(dealTier(-0.3)).toBe('well-below');
    expect(dealTier(-0.15)).toBe('well-below');
    expect(dealTier(-0.149)).toBe('below');
    expect(dealTier(-0.05)).toBe('below');
    expect(dealTier(-0.049)).toBe('near');
    expect(dealTier(0)).toBe('near');
    expect(dealTier(0.049)).toBe('near');
    expect(dealTier(0.05)).toBe('above');
    expect(dealTier(0.149)).toBe('above');
    expect(dealTier(0.15)).toBe('well-above');
  });

  it('works out savings, rank and confidence from real numbers', () => {
    expect(savings(14_990, 18_200)).toBe(3_210);
    expect(savings(21_000, 20_000)).toBe(-1_000);
    expect(priceRankIn([9_000, 10_000, 10_000, 12_000], 10_000)).toBe(2);
    expect(priceRankIn([9_000, 10_000, 12_000], 9_000)).toBe(1);
    expect(confidenceFrom(2)).toBe(1);
    expect(confidenceFrom(5)).toBe(2);
    expect(confidenceFrom(12)).toBe(3);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});
