import { describe, expect, it } from 'vitest';
import { catalog, productsIn } from './catalog';
import { parseQuery } from './parseQuery';
import { excludedFrom, quartile } from './score';
import { search } from './search';

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
    expect(parseQuery('phone for my mum').category).toBe('phone');
    expect(parseQuery('desk for a small flat').category).toBe('furniture');
  });

  it('writes Chinese reasons when asked', () => {
    const result = search('笔记本', 'value', 'zh-Hans');
    expect(result.items.length).toBeGreaterThan(0);
    for (const hit of result.items) {
      expect(hit.reason).toContain('示例');
      expect(hit.reason).not.toMatch(/最便宜|最精致|全市场/);
    }
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

  it('keeps products with fewer than three photos out of every lane', () => {
    for (const lane of ['value', 'cheap', 'refined'] as const) {
      const result = search('', lane);
      expect(result.items.every((hit) => hit.product.imageCount >= 3)).toBe(true);
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
