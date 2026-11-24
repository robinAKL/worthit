import type { Condition, Product } from '../types';

export interface FeedError {
  /** 1-based. JSON uses the item index. CSV uses the file line (line 1 is the header). */
  row: number;
  field: string;
  message: string;
}

export interface FeedParseResult {
  products: Product[];
  errors: FeedError[];
}

const CONDITIONS: readonly Condition[] = ['new', 'refurbished', 'used'];

const REQUIRED = [
  'id',
  'title',
  'category',
  'price',
  'currency',
  'merchant',
  'url',
  'imageCount',
  'condition',
  'capturedAt',
] as const;

/**
 * Turn a merchant JSON array, `{ "products": [...] }`, or CSV string into
 * Product records. A bad row is reported and skipped. Nothing here fetches a URL.
 */
export function parseFeed(input: string): FeedParseResult {
  const text = input.replace(/^\uFEFF/, '').trim();
  if (!text) {
    return { products: [], errors: [{ row: 0, field: 'format', message: 'Feed is empty.' }] };
  }
  if (text.startsWith('{') || text.startsWith('[')) return parseJsonFeed(text);
  return parseCsvFeed(text);
}

function parseJsonFeed(text: string): FeedParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { products: [], errors: [{ row: 0, field: 'format', message: 'JSON could not be parsed.' }] };
  }
  const rows = jsonRows(value);
  if (!rows) {
    return {
      products: [],
      errors: [{ row: 0, field: 'format', message: 'JSON must be an array or an object with a products array.' }],
    };
  }
  return collect(rows, (index) => index + 1);
}

function jsonRows(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as { products?: unknown }).products)) {
    return (value as { products: unknown[] }).products;
  }
  return null;
}

function parseCsvFeed(text: string): FeedParseResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { products: [], errors: [{ row: 0, field: 'format', message: 'CSV has no header.' }] };
  }
  const header = table[0].map((cell) => cell.trim());
  const missing = REQUIRED.filter((field) => !header.includes(field));
  if (missing.length > 0) {
    return {
      products: [],
      errors: missing.map((field) => ({ row: 1, field, message: `Missing CSV column ${field}.` })),
    };
  }
  const records = table.slice(1).map((cells, index) => {
    const record: Record<string, unknown> = {};
    header.forEach((name, column) => {
      if (name) record[name] = cells[column] ?? '';
    });
    return { row: index + 2, record };
  });
  return collect(records.map((entry) => entry.record), (index) => records[index].row);
}

function collect(rows: unknown[], rowNumber: (index: number) => number): FeedParseResult {
  const products: Product[] = [];
  const errors: FeedError[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const number = rowNumber(index);
    const built = buildProduct(row, number);
    if (built.errors.length > 0) {
      errors.push(...built.errors);
      return;
    }
    const product = built.product;
    if (!product) return;
    if (seen.has(product.id)) {
      errors.push({ row: number, field: 'id', message: `Duplicate id ${product.id}.` });
      return;
    }
    seen.add(product.id);
    products.push(product);
  });
  return { products, errors };
}

function buildProduct(row: unknown, rowNumber: number): { product?: Product; errors: FeedError[] } {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return { errors: [{ row: rowNumber, field: 'format', message: 'Row must be an object.' }] };
  }
  const record = row as Record<string, unknown>;
  const errors: FeedError[] = [];
  const fail = (field: string, message: string) => errors.push({ row: rowNumber, field, message });

  for (const field of REQUIRED) {
    if (record[field] === undefined || record[field] === null || String(record[field]).trim() === '') {
      fail(field, `${field} is required.`);
    }
  }
  if (errors.length > 0) return { errors };

  const id = text(record.id);
  const title = text(record.title);
  const category = text(record.category);
  const merchant = text(record.merchant);
  const currency = text(record.currency).toUpperCase();
  const condition = text(record.condition) as Condition;
  const price = Number(record.price);
  const imageCount = Number(record.imageCount);
  const url = text(record.url);
  const capturedAt = text(record.capturedAt);

  if (!Number.isFinite(price) || price <= 0) fail('price', 'price must be a positive number.');
  if (currency !== 'NZD') fail('currency', 'currency must be NZD.');
  if (!isHttps(url)) fail('url', 'url must be an https URL.');
  if (!Number.isInteger(imageCount) || imageCount < 0) fail('imageCount', 'imageCount must be an integer.');
  if (!CONDITIONS.includes(condition)) fail('condition', 'condition must be new, refurbished, or used.');
  if (!isIsoDate(capturedAt)) fail('capturedAt', 'capturedAt must be an ISO date.');

  const specs = readSpecs(record.specs, fail);
  const titles = readTitles(record, title, fail);
  const wasPrice = optionalNumber(record.wasPrice, 'wasPrice', fail);
  const rating = optionalNumber(record.rating, 'rating', fail);
  const reviewCount = optionalInteger(record.reviewCount, 'reviewCount', fail);
  const warrantyMonths = optionalInteger(record.warrantyMonths, 'warrantyMonths', fail);
  const imageUrl = record.imageUrl === undefined || record.imageUrl === '' ? undefined : text(record.imageUrl);
  if (imageUrl !== undefined && !isHttps(imageUrl)) fail('imageUrl', 'imageUrl must be an https URL.');
  if (rating !== undefined && (rating < 0 || rating > 5)) fail('rating', 'rating must be from 0 to 5.');

  if (errors.length > 0 || !specs) return { errors };

  const product: Product = {
    id,
    title,
    titles,
    category,
    price,
    merchant,
    url,
    imageCount,
    condition,
    specs,
    capturedAt,
    source: 'feed',
    fixture: false,
  };
  if (wasPrice !== undefined) product.wasPrice = wasPrice;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;
  if (rating !== undefined) product.rating = rating;
  if (reviewCount !== undefined) product.reviewCount = reviewCount;
  if (warrantyMonths !== undefined) product.warrantyMonths = warrantyMonths;
  return { product, errors };
}

function readSpecs(
  value: unknown,
  fail: (field: string, message: string) => void,
): Record<string, string | number> | undefined {
  if (value === undefined || value === '') return {};
  const parsed = typeof value === 'string' ? parseJsonObject(value) : value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('specs', 'specs must be an object.');
    return undefined;
  }
  const specs: Record<string, string | number> = {};
  for (const [key, entry] of Object.entries(parsed)) {
    if (typeof entry === 'string' || typeof entry === 'number') specs[key] = entry;
    else {
      fail('specs', `specs.${key} must be a string or number.`);
      return undefined;
    }
  }
  return specs;
}

function readTitles(
  record: Record<string, unknown>,
  title: string,
  fail: (field: string, message: string) => void,
): Product['titles'] {
  const titles: NonNullable<Product['titles']> = { en: title };
  const zh = record.title_zh ?? record['titles.zh-Hans'];
  if (typeof zh === 'string' && zh.trim()) titles['zh-Hans'] = zh.trim();
  if (record.titles !== undefined && record.titles !== '') {
    const parsed = typeof record.titles === 'string' ? parseJsonObject(record.titles) : record.titles;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      fail('titles', 'titles must be an object.');
    } else {
      for (const [key, entry] of Object.entries(parsed)) {
        if (key !== 'en' && key !== 'zh-Hans') fail('titles', `titles.${key} is not a supported locale.`);
        else if (typeof entry !== 'string' || !entry.trim()) fail('titles', `titles.${key} must be a non-empty string.`);
        else titles[key] = entry.trim();
      }
    }
  }
  return titles;
}

function optionalNumber(
  value: unknown,
  field: string,
  fail: (field: string, message: string) => void,
): number | undefined {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    fail(field, `${field} must be a number.`);
    return undefined;
  }
  return number;
}

function optionalInteger(
  value: unknown,
  field: string,
  fail: (field: string, message: string) => void,
): number | undefined {
  const number = optionalNumber(value, field, fail);
  if (number === undefined) return undefined;
  if (!Number.isInteger(number) || number < 0) {
    fail(field, `${field} must be an integer.`);
    return undefined;
  }
  return number;
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  return String(value).trim();
}

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) return false;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return !Number.isNaN(date.getTime());
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }
  return rows;
}
