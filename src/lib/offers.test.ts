import { describe, expect, it } from 'vitest';
import type { Product } from './types';
import { matchKey, matchOffers, normaliseCode } from './offers';

function product(patch: Partial<Product> & Pick<Product, 'id' | 'merchant' | 'price'>): Product {
  return {
    title: patch.id,
    category: 'whiteware',
    url: `https://example.com/${patch.id}`,
    imageCount: 1,
    condition: 'new',
    specs: {},
    capturedAt: '2026-11-24T00:00:00.000Z',
    source: 'feed',
    fixture: false,
    ...patch,
  };
}

describe('cross-shop match', () => {
  it('treats spacing and hyphens as the same model, and prefers a GTIN', () => {
    expect(normaliseCode('RB-30 N')).toBe('rb30n');
    const byModel = [
      product({ id: 'a', merchant: 'Ascent', price: 100, specs: { brand: 'Samsung', model: 'RB-30' } }),
      product({ id: 'b', merchant: 'Baby Factory', price: 90, specs: { brand: 'samsung', model: 'rb 30' } }),
    ];
    expect(matchKey(byModel[0])).toBe(matchKey(byModel[1]));
    const grouped = matchOffers(byModel);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].offers.map((offer) => offer.merchant).sort()).toEqual(['Ascent', 'Baby Factory']);

    const byCode = [
      product({ id: 'c', merchant: 'Ascent', price: 10, specs: { gtin: '123', brand: 'A', model: 'one' } }),
      product({ id: 'd', merchant: 'Other', price: 12, specs: { gtin: '123', brand: 'A', model: 'two' } }),
    ];
    expect(matchOffers(byCode)[0].offers).toHaveLength(2);
    expect(matchOffers([byCode[0]])).toHaveLength(0);
  });
});
