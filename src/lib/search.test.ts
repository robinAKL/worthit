import { describe, expect, it } from 'vitest';
import { catalog, productsIn } from './catalog';
import { parseQuery } from './parseQuery';
import { countsAsSpec, excludedFrom, quartile, reasonFor } from './score';
import { comparisonKey, search } from './search';

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
    expect(parseQuery('laptop under $1500')).toMatchObject({ category: 'laptop', budgetMax: 1500 });
    expect(parseQuery('Laptop under $1,500').budgetMax).toBe(1500);
    expect(parseQuery('phone for my mum').category).toBe('phone');
    expect(parseQuery('desk for a small flat').category).toBe('furniture');
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
      expect(reason).toContain(locale === 'en' ? '2 specs' : '2 项');
    }
    expect(excludedFrom(product, 'cheap', 100)).toBe(false);
    expect(excludedFrom({ ...product, condition: 'used' }, 'cheap', 100)).toBe(true);
    expect(excludedFrom({ ...product, fixture: true, imageCount: 4, reviewCount: 0 }, 'cheap', 100)).toBe(true);
  });

  it('keeps a captured price that has one catalog photo', () => {
    const captured = {
      ...productsIn('laptop')[0],
      fixture: false,
      source: 'feed' as const,
      imageCount: 1,
      specs: { brand: 'Acer' },
    };
    expect(excludedFrom(captured, 'value', 1000)).toBe(false);
    expect(excludedFrom({ ...captured, fixture: true, imageCount: 1 }, 'value', 1000)).toBe(true);
  });

  it('drops laptops without enough photos from the cheap lane', () => {
    const result = search('笔记本', 'cheap');
    expect(result.fixture).toBe(true);
    expect(result.items.every((hit) => hit.product.imageCount >= 3)).toBe(true);
    expect(result.items.some((hit) => hit.product.id === 'laptop-01')).toBe(false);
    expect(result.excludedCount).toBeGreaterThan(0);
  });

  it('drops products with no specs from the value lane', () => {
    const result = search('笔记本', 'value');
    expect(result.items.some((hit) => hit.product.id === 'laptop-06')).toBe(false);
    expect(
      result.items.every((hit) => Object.keys(hit.product.specs).some((key) => key !== 'note')),
    ).toBe(true);
  });

  it('drops vague condition text from the refined lane', () => {
    const result = search('手机', 'refined');
    expect(result.items.some((hit) => hit.product.id === 'phone-10')).toBe(false);
    expect(result.items.every((hit) => hit.product.specs.note !== '很好')).toBe(true);
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

  it('keeps sample products with fewer than three photos out of every lane', () => {
    for (const lane of ['value', 'cheap', 'refined'] as const) {
      const result = search('', lane);
      const samples = result.items.filter((hit) => hit.product.fixture);
      expect(samples.every((hit) => hit.product.imageCount >= 3)).toBe(true);
      expect(result.items.filter((hit) => !hit.product.fixture).every((hit) => hit.product.imageCount >= 1)).toBe(true);
      expect(result.items.some((hit) => hit.product.id === 'laptop-01')).toBe(false);
      expect(result.items.some((hit) => hit.product.id === 'phone-01')).toBe(false);
      expect(result.items.some((hit) => hit.product.id === 'furn-01')).toBe(false);
    }
  });

  it('uses the lower quartile as the cheap cutoff', () => {
    const group = productsIn('laptop');
    const prices = group.map((product) => product.price).sort((a, b) => a - b);
    const lower = quartile(prices, 0.25);
    const cheap = search('笔记本', 'cheap');
    expect(cheap.items.every((hit) => hit.product.price <= lower)).toBe(true);
    expect(cheap.items.every((hit) => hit.band === 'low')).toBe(true);
    expect(excludedFrom(group[0], 'cheap', lower)).toBe(true);
  });
});
