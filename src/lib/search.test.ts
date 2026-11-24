import { describe, expect, it } from 'vitest';
import { catalog, productsIn } from './catalog';
import { parseQuery } from './parseQuery';
import { countsAsSpec, excludedFrom, laneScore, quartile, reasonFor, specPoints } from './score';
import { comparisonKey, search, withoutNeedlessSamples } from './search';
import { sizeBand, specFromProduct } from './specs';

describe('parseQuery', () => {
  it('reads a budget and a laptop category', () => {
    const parsed = parseQuery('2000刀以内适合学生的笔记本');
    expect(parsed.category).toBe('laptop');
    expect(parsed.budgetMax).toBe(2000);
    expect(parsed.keywords).toContain('学生');
  });

  it('reads a dollar budget for phones', () => {
    const parsed = parseQuery('手机 $900 以下');
    expect(parsed.category).toBe('phone');
    expect(parsed.budgetMax).toBe(900);
  });
});

describe('catalog', () => {
  it('has three fixture categories with 8 to 12 placeholder products', () => {
    for (const category of ['laptop', 'phone', 'furniture']) {
      const products = productsIn(category);
      expect(products.length).toBeGreaterThanOrEqual(8);
      expect(products.length).toBeLessThanOrEqual(12);
      for (const product of products) {
        expect(product.fixture).toBe(true);
        expect(product.source).toBe('fixture');
        expect(product.merchant.startsWith('Sample Store')).toBe(true);
        expect(product.titles?.['zh-Hans']).toBeTruthy();
        expect(product.title).not.toMatch(/[\u4e00-\u9fff]/);
        for (const value of Object.values(product.specs)) {
          expect(String(value)).not.toMatch(/[\u4e00-\u9fff]/);
        }
        expect(product.url.startsWith('https://example.com/')).toBe(true);
        expect(product.title).not.toMatch(/Trade Me|Warehouse|Noel Leeming|PB Tech|Mighty Ape/i);
      }
    }
    expect(catalog).toHaveLength(30);
  });
});

describe('search', () => {
  it('reads the English sample prompts', () => {
    expect(parseQuery('laptop under $1500')).toMatchObject({ category: 'laptop', budgetMax: 1500, kind: 'product' });
    expect(parseQuery('Laptop under $1,500').budgetMax).toBe(1500);
    expect(parseQuery('phone for my mum').category).toBe('phone');
    expect(parseQuery('desk for a small flat').category).toBe('furniture');
    expect(parseQuery('car under $15000')).toMatchObject({ kind: 'car', budgetMax: 15000 });
    expect(parseQuery('二手车 2万以内')).toMatchObject({ kind: 'car', budgetMax: 20000 });
  });

  it('narrows fridge words and does not dump the catalogue for an unknown search', () => {
    const all = search('', 'value', 'en');
    const fridge = search('fridge', 'value', 'en');
    const chinese = search('冰箱', 'value', 'zh-Hans');
    expect(fridge.items.length).toBeGreaterThan(0);
    expect(fridge.items.length).toBeLessThan(all.items.length);
    expect(fridge.items.every((hit) => /fridge|refrigerator|freezer/i.test(hit.product.title))).toBe(true);
    expect(chinese.items.map((hit) => hit.product.id)).toEqual(fridge.items.map((hit) => hit.product.id));
    expect(search('Toyota Aqua', 'value', 'en').items).toHaveLength(0);
    expect(search('car under $15000', 'value', 'en').items).toHaveLength(0);
    expect(search('phone for my mum', 'value', 'en').items.length).toBeGreaterThan(0);
    expect(search('laptop under $1500', 'value', 'en').items.every((hit) => hit.product.category === 'laptop' && hit.product.price <= 1500)).toBe(true);
  });

  it('describes a cheap-lane price at the quartile as at or below', () => {
    const product = productsIn('phone').find((item) => item.id === 'phone-02');
    expect(product).toBeTruthy();
    if (!product) return;
    const reason = reasonFor(product, 'cheap', product.price, product.price, 'en');
    expect(reason).toContain('at or below');
    expect(reason).not.toMatch(/under the sample/);
    expect(product.localizedSpecs?.['zh-Hans']?.note).toMatch(/[\u4e00-\u9fff]/);
  });

  it('writes Chinese reasons when asked', () => {
    const result = search('笔记本', 'value', 'zh-Hans');
    expect(result.items.length).toBeGreaterThan(0);
    for (const hit of result.items) {
      expect(hit.reason).toContain('示例');
      expect(hit.reason).not.toMatch(/最便宜|最精致|全市场/);
    }
  });

  it('keeps a water filter out of the fridge quartile', () => {
    const make = (id: string, title: string, price: number) => ({
      ...productsIn('laptop')[0],
      id,
      title,
      fixture: false,
      source: 'feed' as const,
      category: 'whiteware',
      price,
      imageCount: 1,
      reviewCount: undefined,
      specs: { brand: 'Samsung', stock: 'in stock' },
      url: 'https://www.ascent.co.nz/productspecification.aspx?itemID=1',
    });
    const filter = make('filter', 'Refrigerator Water Filter', 72);
    const fridges = [1000, 1200, 1400, 1600, 1800, 2000].map((price, index) => make(`fridge-${index}`, 'Bar Fridge', price));
    expect(comparisonKey(filter)).not.toBe(comparisonKey(fridges[0]));
    const result = search('', 'value', 'en', [filter, ...fridges]);
    const cheap = result.items.find((hit) => hit.product.id === 'filter');
    expect(cheap?.ranked).toBe(false);
    expect(cheap?.reason).not.toMatch(/1580|median|quartile/);
    const ranked = result.items.find((hit) => hit.product.id === 'fridge-2');
    expect(ranked?.ranked).toBe(true);
    expect(ranked?.reason).not.toContain('72');
  });

  it('does not compare a fridge with a car seat, or cite a quartile for a tiny group', () => {
    const fridge = { ...productsIn('laptop')[0], id: 'fridge', fixture: false, source: 'feed' as const, category: 'fridges', title: 'Fridge', price: 900, imageCount: 1, specs: { brand: 'Samsung' } };
    const seat = { ...productsIn('phone')[0], id: 'seat', fixture: false, source: 'feed' as const, category: 'car-seats', title: 'Booster', price: 80, imageCount: 1, specs: { brand: 'Cozy' } };
    expect(comparisonKey(fridge)).not.toBe(comparisonKey(seat));
    const result = search('', 'value', 'en', [fridge, seat]);
    expect(result.items).toHaveLength(2);
    for (const hit of result.items) {
      expect(hit.ranked).toBe(false);
      expect(hit.reason).not.toMatch(/quartile|median|四分位|中位/);
      expect(hit.reason).toContain('Price captured from the merchant');
    }
  });

  it('does not present a catalog number as a spec, or a missing review as zero', () => {
    const product = {
      ...productsIn('phone')[0],
      fixture: false,
      source: 'feed' as const,
      condition: 'new' as const,
      reviewCount: undefined,
      imageCount: 1,
      price: 10,
      url: 'https://www.ascent.co.nz/productspecification.aspx?itemID=566531',
      specs: { brand: 'Samsung', model: '566531', stock: 'in stock' },
    };
    expect(countsAsSpec(product, 'model', '566531')).toBe(false);
    expect(countsAsSpec(product, 'brand', 'Samsung')).toBe(true);
    for (const locale of ['en', 'zh-Hans'] as const) {
      const reason = reasonFor(product, 'value', 100, 200, locale);
      expect(reason).not.toMatch(/0 reviews|photos|反馈 0 条|图片/);
      // Value says how far from the group's middle price, nothing else.
      expect(reason).toContain(locale === 'en' ? '95% below' : '低 95%');
    }
    expect(excludedFrom(product, 'cheap', 100)).toBe(false);
    expect(excludedFrom({ ...product, condition: 'used' }, 'cheap', 100)).toBe(true);
    expect(excludedFrom({ ...product, fixture: true, imageCount: 4, reviewCount: 0 }, 'cheap', 100)).toBe(true);
  });

  it('never lets the number of photos decide a lane or a score', () => {
    const captured = { ...productsIn('laptop')[0], fixture: false, source: 'feed' as const, specs: { brand: 'Acer' } };
    for (const lane of ['value', 'cheap', 'refined'] as const) {
      expect(excludedFrom({ ...captured, imageCount: 0 }, lane, 1000, 1200)).toBe(excludedFrom({ ...captured, imageCount: 12 }, lane, 1000, 1200));
      expect(laneScore({ ...captured, imageCount: 0 }, lane, 1200)).toBe(laneScore({ ...captured, imageCount: 12 }, lane, 1200));
    }
    expect(excludedFrom({ ...captured, fixture: true, imageCount: 1 }, 'value', 1000)).toBe(false);
  });

  it('leaves out of the cheap lane anything out of stock or without specs', () => {
    const p = { ...productsIn('laptop')[0], fixture: false, source: 'feed' as const, specs: { brand: 'Acer', stock: 'in stock' } };
    expect(excludedFrom(p, 'cheap', 10_000)).toBe(false);
    expect(excludedFrom({ ...p, specs: { brand: 'Acer', stock: 'out of stock' } }, 'cheap', 10_000)).toBe(true);
    expect(excludedFrom({ ...p, specs: {} }, 'cheap', 10_000)).toBe(true);
  });

  it('drops products with no specs from the value lane', () => {
    const result = search('笔记本', 'value');
    expect(result.items.some((hit) => hit.product.id === 'laptop-06')).toBe(false);
    expect(
      result.items.every((hit) => Object.keys(hit.product.specs).some((key) => key !== 'note')),
    ).toBe(true);
  });

  it('ranks "Higher spec" only among similarly priced items, by measurable spec', () => {
    const base = { ...productsIn('laptop')[0], fixture: false, source: 'feed' as const, warrantyMonths: undefined, spec: { family: 'laptop' as const, ramGb: 16, storageGb: 512, source: 'rules' as const, evidence: {} } };
    expect(specPoints(base)).toBeGreaterThan(0);
    expect(specPoints({ ...base, spec: undefined })).toBe(0);
    // No measurable spec, or priced outside 25% of the median: not in this lane.
    expect(excludedFrom({ ...base, spec: undefined }, 'refined', 0, base.price)).toBe(true);
    expect(excludedFrom(base, 'refined', 0, base.price * 2)).toBe(true);
    expect(excludedFrom(base, 'refined', 0, base.price)).toBe(false);
    // More memory at the same price ranks higher.
    const more = { ...base, spec: { ...base.spec, ramGb: 32 } };
    expect(laneScore(more, 'refined', base.price)).toBeGreaterThan(laneScore(base, 'refined', base.price));
    for (const hit of search('笔记本', 'refined').items.filter((h) => h.ranked !== false)) expect(hit.reason).not.toMatch(/photo|图片|quality|质量/i);
  });

  it('keeps reasons inside the fixture set', () => {
    const result = search('2000刀以内适合学生的笔记本', 'value');
    expect(result.items.length).toBeGreaterThan(0);
    for (const hit of result.items) {
      expect(hit.product.price).toBeLessThanOrEqual(2000);
      expect(hit.product.category).toBe('laptop');
      expect(hit.reason).not.toMatch(/最便宜|最精致|全市场/);
      expect(hit.reason).toContain(String(hit.product.price));
      expect(hit.reason).toContain('Sample price');
      expect(hit.reason).not.toMatch(/cheapest|lowest in market|\bbest\b/i);
    }
  });

  it('answers the three sample prompts on the page', () => {
    const laptops = search('1500 刀以内的笔记本', 'value');
    expect(laptops.query.category).toBe('laptop');
    expect(laptops.query.budgetMax).toBe(1500);
    expect(laptops.items.length).toBeGreaterThan(0);
    expect(laptops.items.every((hit) => hit.product.price <= 1500)).toBe(true);

    const phones = search('适合老人用的手机', 'cheap');
    expect(phones.query.category).toBe('phone');
    expect(phones.items.every((hit) => hit.product.category === 'phone')).toBe(true);

    const desks = search('小公寓用的书桌', 'refined');
    expect(desks.query.category).toBe('furniture');
    expect(desks.items.every((hit) => hit.product.category === 'furniture')).toBe(true);
  });


  it('uses the lower quartile as the cheap cutoff', () => {
    const group = productsIn('laptop');
    const prices = group.map((product) => product.price).sort((a, b) => a - b);
    const lower = quartile(prices, 0.25);
    // Laptops compare within a RAM band, so the cutoff is the lower quartile of each band.
    const bandOf = (p: (typeof group)[number]) => sizeBand(specFromProduct(p)!);
    const lowerIn = (band: string | undefined) =>
      quartile(group.filter((p) => bandOf(p) === band).map((p) => p.price).sort((a, b) => a - b), 0.25);
    const cheap = search('笔记本', 'cheap');
    expect(cheap.items.length).toBeGreaterThan(0);
    expect(cheap.items.every((hit) => hit.product.price <= lowerIn(bandOf(hit.product)))).toBe(true);
    expect(cheap.items.every((hit) => hit.band === 'low')).toBe(true);
    expect(excludedFrom({ ...group[0], specs: {} }, 'cheap', lower)).toBe(true);
  });
});

describe('sample products only fill a gap (T-37)', () => {
  const live = { id: 'r1', fixture: false, category: 'whiteware' } as never;
  const sampleSame = { id: 's1', fixture: true, category: 'whiteware' } as never;
  const sampleOther = { id: 's2', fixture: true, category: 'laptop' } as never;

  it('hides every sample on the start page once any real product exists', () => {
    expect(withoutNeedlessSamples([live, sampleSame, sampleOther], true).map((p: { id: string }) => p.id)).toEqual(['r1']);
  });

  it('in a search, keeps samples only for categories with no real product', () => {
    expect(withoutNeedlessSamples([live, sampleSame, sampleOther], false).map((p: { id: string }) => p.id)).toEqual(['r1', 's2']);
    expect(withoutNeedlessSamples([sampleSame, sampleOther], true).map((p: { id: string }) => p.id)).toEqual(['s1', 's2']);
  });

  it('shows real products on the start page', () => {
    expect(search('', 'value').items.every((hit) => !hit.product.fixture)).toBe(true);
  });
});

describe('Chinese words find English listings', () => {
  it('finds strollers for 婴儿车 and fridges for 冰箱', () => {
    const strollers = search('婴儿车', 'value', 'zh-Hans').items;
    expect(strollers.length).toBeGreaterThan(0);
    expect(strollers.every((hit) => /stroller|pram|pushchair|buggy/i.test(`${hit.product.title} ${hit.product.category}`))).toBe(true);
    expect(search('冰箱', 'value', 'zh-Hans').items.length).toBeGreaterThan(0);
  });
});
