import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { appendSnapshots } from '../../src/lib/history.ts';

/** Append one price point per product for this run. Same day replaces. Keeps 90 days. */
export function recordHistory(root, site, products, today = new Date().toISOString().slice(0, 10)) {
  const dir = join(root, 'src', 'data', 'history');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${site}.json`);
  const prior = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const next = appendSnapshots(
    prior,
    products.map((product) => ({ id: product.id, price: product.price })),
    today,
  );
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
}
