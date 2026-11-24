import { describe, expect, it } from 'vitest';
import sampleCsv from './sample-feed.csv?raw';
import sampleJson from './sample-feed.json?raw';
import { parseFeed } from './parseFeed';

const good = {
  id: 'sample-lamp-01',
  title: 'Sample desk lamp',
  title_zh: '示例台灯',
  category: 'furniture',
  price: 89,
  currency: 'NZD',
  merchant: 'Sample Store D',
  url: 'https://example.com/feed/sample-lamp-01',
  imageCount: 4,
  condition: 'new',
  capturedAt: '2026-11-24',
  specs: { note: 'Example feed row. Not a live price.' },
};

describe('parseFeed', () => {
  it('reads the sample JSON and CSV files as feed products', () => {
    for (const file of [sampleJson, sampleCsv]) {
      const result = parseFeed(file);
      expect(result.errors).toEqual([]);
      expect(result.products).toHaveLength(2);
      for (const product of result.products) {
        expect(product.source).toBe('feed');
        expect(product.fixture).toBe(false);
        expect(product.merchant).toBe('Sample Store D');
        expect(product.titles?.['zh-Hans']).toBeTruthy();
        expect(product.url.startsWith('https://example.com/feed/')).toBe(true);
      }
    }
  });

  it('keeps a good row when the next row fails several checks', () => {
    const result = parseFeed(
      JSON.stringify([
        good,
        {
          ...good,
          id: 'sample-bad-01',
          price: -5,
          currency: 'USD',
          url: 'http://example.com/feed/sample-bad-01',
          imageCount: 1.5,
          capturedAt: '24/11/2026',
        },
      ]),
    );
    expect(result.products.map((product) => product.id)).toEqual(['sample-lamp-01']);
    expect(result.products[0].source).toBe('feed');
    expect(result.products[0].fixture).toBe(false);
    const fields = result.errors.filter((error) => error.row === 2).map((error) => error.field);
    expect(fields).toEqual(expect.arrayContaining(['price', 'currency', 'url', 'imageCount', 'capturedAt']));
    expect(result.errors.every((error) => error.message.length > 0)).toBe(true);
  });

  it('reports a CSV data-row line and still returns the valid line', () => {
    const csv = [
      'id,title,category,price,currency,merchant,url,imageCount,condition,capturedAt',
      'sample-ok,Sample mug,home,25,NZD,Sample Store D,https://example.com/feed/sample-ok,3,new,2026-11-24',
      'sample-bad,Sample mug,home,0,AUD,Sample Store D,notaurl,nope,used,yesterday',
    ].join('\n');
    const result = parseFeed(csv);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('sample-ok');
    expect(result.errors.every((error) => error.row === 3)).toBe(true);
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['price', 'currency', 'url', 'imageCount', 'capturedAt']),
    );
  });
});
