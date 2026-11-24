import { expect, it } from 'vitest';
import { en } from './en';
import { search } from '../lib/search';

it('understands the formatted budget in the English example shown on the page', () => {
  const result = search(en.hero.examples[0], 'value', 'en');
  expect(result.query.budgetMax).toBe(1500);
  expect(result.items.length).toBeGreaterThan(0);
  expect(result.items.every(({ product }) => product.category === 'laptop' && product.price <= 1500)).toBe(true);
});
