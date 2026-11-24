import { describe, expect, it } from 'vitest';
import { sizeBand, specFromProduct, specFromTitle, unitPrice, verifySpec } from './specs';

/** Real titles from the collected Ascent and Baby Factory feeds. */
const cases: Array<[string, Record<string, unknown>]> = [
  ['Midea MDRD181FGM01AP 124L Bar Fridge', { family: 'fridge', style: 'bar', size: 124, unit: 'L' }],
  ['Midea MDRC154FZE01APE 99L Chest Freezer', { family: 'freezer', style: 'chest', size: 99, unit: 'L' }],
  ['Midea MDRD129FGF01AP 83L Compact Bar Freezer', { family: 'freezer', style: 'bar', size: 83 }],
  ['Samsung RF48A4000M9/SA 488L French Door Refrigerator, Silver, Twin Cooling Plus', { family: 'fridge', style: 'french-door', size: 488 }],
  ['Samsung RS70F65Q5FSA 655L Side-by-Side Refrigerator, Black', { family: 'fridge', style: 'side-by-side', size: 655 }],
  ['Samsung RB30N4020WW/SA 310L Refrigerator, White, Bottom Mounted Freezer, Optimal Fresh Zone', { family: 'fridge', style: 'bottom-mount', size: 310 }],
  ['Samsung RT31CG542AS9SA 305L TMF Optimal Fresh Refrigerator, Top Mount Freezer', { family: 'fridge', style: 'top-mount', size: 305 }],
  ['Samsung RZ40H32UBVSA 323L Single Door Freezer, White, Precise Cooling', { family: 'freezer', style: 'upright', size: 323 }],
  ['Samsung WW90DG6U94LESA 9kg Front-load Washer, White, AI Wash', { family: 'washer', style: 'front-load', size: 9, unit: 'kg' }],
  ['Samsung WA60CG4545BWSA 6kg Top-load Washer, White, BubbleWash', { family: 'washer', style: 'top-load', size: 6 }],
  ['Samsung DV90DGC4A0AESA 9kg Heat Pump Dryer, White, Hygiene Care', { family: 'dryer', style: 'heat-pump', size: 9 }],
  ['Samsung MS23DG4504ATSA 23L Solo Microwave Oven, Stainless Steel, Auto Cook, Ceramic Enamel', { family: 'microwave', size: 23 }],
  ['Samsung DW60M6055FS/SA Freestanding Dishwasher, Silver, Flexible 3rd Rack, 14 Place Setting', { family: 'dishwasher', size: 14, unit: 'place' }],
  ['Samsung HAF-QIN/EXP HAFEX Refrigerator Water Filter', { family: 'accessory' }],
  ['Samsung SKK-UUW Washing Machine Stacking Kit', { family: 'accessory' }],
  ['Samsung RR40H39G4TSA + RZ40H32UBTSA Single Door Fridge + Vertical Freezer Combo - Silver', { family: 'combo' }],
  ['Cozy N Safe Elias I-size Booster Seat', { family: 'car-seat', style: 'booster', iSize: true }],
  ['Safety First Everslim All In One Convertible Car Seat Mountain Air', { family: 'car-seat', style: 'convertible', iSize: false }],
];

describe('spec rules', () => {
  it.each(cases)('%s', (title, expected) => {
    expect(specFromTitle(title)).toMatchObject({ ...expected, source: 'rules' });
  });

  it('keeps the title fragment behind every value', () => {
    const spec = specFromTitle('Midea MDRC211FZE01APE 143L Chest Freezer')!;
    expect(spec.evidence).toEqual({ family: 'Chest Freezer', size: '143L' });
  });

  it('returns null for titles outside the known families', () => {
    expect(specFromTitle('Star Wars Grogu Hooded Towel & Wash Mitt Set')).toBeNull();
  });

  it('works out a price per unit only when the size is known', () => {
    expect(unitPrice(377.74, specFromTitle('Midea 124L Bar Fridge')!)).toBeCloseTo(3.046, 3);
    expect(unitPrice(100, specFromTitle('Samsung Refrigerator Water Filter')!)).toBeUndefined();
  });
});

describe('AI spec check', () => {
  const title = 'Fisher & Paykel RF610ADX6 569L French Door Fridge';

  it('accepts values that appear in the title', () => {
    expect(verifySpec(title, { family: 'fridge', style: 'french-door', size: 569, evidence: { family: 'Fridge', style: 'French Door', size: '569L' } })).toMatchObject({
      family: 'fridge',
      style: 'french-door',
      size: 569,
      unit: 'L',
      source: 'ai',
    });
  });

  it('drops any value whose evidence is not in the title, and rejects an unsupported family', () => {
    const spec = verifySpec(title, { family: 'fridge', size: 600, evidence: { family: 'Fridge', size: '600L' } })!;
    expect(spec.size).toBeUndefined();
    expect(verifySpec(title, { family: 'washer', evidence: { family: 'Washer' } })).toBeNull();
    expect(verifySpec(title, { family: 'fridge', size: 569, evidence: { family: 'Fridge', size: '56' } })!.size).toBeUndefined();
  });
});

describe('structured facts, laptops, car seats, energy stars', () => {
  it('reads laptop RAM, storage and screen from catalogue specs as well as the title', () => {
    const spec = specFromProduct({ title: '14 寸示例笔记本，16GB 内存', specs: { memory: '16GB', screen: '14 寸', storage: '512GB', note: '键盘无缺损' } })!;
    expect(spec).toMatchObject({ family: 'laptop', ramGb: 16, storageGb: 512, screenIn: 14 });
    expect(spec.evidence.storageGb).toBe('512GB storage');
    expect(sizeBand(spec)).toBe('ram16');
    expect(sizeBand(specFromProduct({ title: 'Laptop 32GB RAM 1TB SSD 16-inch Core i7' })!)).toBe('ram32');
    expect(specFromProduct({ title: 'Laptop 32GB RAM 1TB SSD 16-inch Core i7' })).toMatchObject({ storageGb: 1024, screenIn: 16, cpuTier: 'high' });
  });

  it('reads ISOFIX and the use range on car seats only when stated, and energy stars on appliances', () => {
    expect(specFromTitle('Britax Safe-n-Sound Maxi Guard Pro ISOFIX Booster Seat 15-36kg')).toMatchObject({
      family: 'car-seat',
      isofix: true,
      range: { min: 15, max: 36, unit: 'kg' },
    });
    const plain = specFromTitle('Cozy N Safe Elias I-size Booster Seat')!;
    expect(plain.isofix).toBeUndefined();
    expect(plain.range).toBeUndefined();
    expect(specFromTitle('Haier HRF450 450L French Door Refrigerator 4 Star')).toMatchObject({ energyStars: 4, size: 450 });
  });

  it('puts fridges in capacity bands', () => {
    expect(sizeBand(specFromTitle('Midea 124L Bar Fridge')!)).toBe('compact');
    expect(sizeBand(specFromTitle('Samsung 310L Refrigerator, Bottom Mounted Freezer')!)).toBe('mid');
    expect(sizeBand(specFromTitle('Samsung 655L Side-by-Side Refrigerator')!)).toBe('large');
  });

  it('drops an AI field the model is not sure about', () => {
    const title = 'Fisher & Paykel RF610ADX6 569L French Door Fridge';
    const spec = verifySpec(title, {
      family: 'fridge',
      style: 'french-door',
      size: 569,
      evidence: { family: 'Fridge', style: 'French Door', size: '569L' },
      confidence: { family: 0.95, style: 0.4, size: 0.9 },
    })!;
    expect(spec.style).toBeUndefined();
    expect(spec.size).toBe(569);
    expect(spec.confidence).toEqual({ family: 0.95, size: 0.9 });
    expect(verifySpec(title, { family: 'fridge', evidence: { family: 'Fridge' }, confidence: { family: 0.3 } })).toBeNull();
  });
});
