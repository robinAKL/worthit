// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { figureFromTitle, specTile } from './specTile';

const product = (over) => ({ title: '', category: 'whiteware', specs: { brand: 'Samsung' }, ...over });

describe('spec tile for products without a permitted photo', () => {
  it('leads with the capacity and names the kind, in both languages', () => {
    const p = product({ spec: { family: 'fridge', style: 'french-door', size: 488, unit: 'L', source: 'rules' } });
    expect(specTile(p, 'en')).toEqual({ brand: 'Samsung', figure: '488 L', detail: 'French-door fridge' });
    expect(specTile(p, 'zh-Hans')).toEqual({ brand: 'Samsung', figure: '488 升', detail: '法式多门冰箱' });
  });

  it('shows screen and memory for laptops, and a use range for car seats', () => {
    expect(specTile(product({ category: 'laptop', spec: { family: 'laptop', screenIn: 14, ramGb: 32, source: 'rules' } }), 'en').figure).toBe('14″ · 32 GB');
    const seat = product({ category: 'booster-seats', spec: { family: 'car-seat', range: { min: 15, max: 36, unit: 'kg' }, source: 'rules' } });
    expect(specTile(seat, 'en')).toMatchObject({ figure: '15–36 kg', detail: 'Booster seat' });
    expect(specTile(seat, 'zh-Hans')).toMatchObject({ figure: '15–36 公斤', detail: '增高座椅' });
  });

  it('falls back to a number in the title, then to brand and kind only', () => {
    expect(figureFromTitle('Samsung ME6104ST1 28L Microwave Oven', 'en')).toBe('28 L');
    expect(figureFromTitle('LG 9kg Front Loader', 'zh-Hans')).toBe('9 公斤');
    expect(figureFromTitle('Baby Jogger City Mini GT2', 'en')).toBeUndefined();
    expect(specTile(product({ category: '4-wheel-strollers', specs: { brand: 'Baby Jogger' }, title: 'Baby Jogger City Mini GT2' }), 'en')).toEqual({
      brand: 'Baby Jogger',
      figure: undefined,
      detail: 'Stroller',
    });
  });

  it('never invents a brand, and humanises unknown categories', () => {
    expect(specTile(product({ category: '3-in-1-cots', specs: {} }), 'en')).toEqual({ brand: undefined, figure: undefined, detail: '3 in 1 cots' });
  });
});
