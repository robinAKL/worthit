import type { Product } from './types';

/** Lower case, with spaces and hyphens removed, so "RB-30" and "rb 30" compare equal. */
export function normaliseCode(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '');
}

function spec(product: Product, key: string): string {
  const value = product.specs[key];
  return value === undefined ? '' : String(value).trim();
}

/**
 * GTIN first, then MPN, then brand plus model.
 * Empty when none of those are present.
 */
export function matchKey(product: Product): string | null {
  const gtin = spec(product, 'gtin');
  if (gtin) return `gtin:${normaliseCode(gtin)}`;
  const mpn = spec(product, 'mpn');
  if (mpn) return `mpn:${normaliseCode(mpn)}`;
  const brand = spec(product, 'brand');
  const model = spec(product, 'model');
  if (brand && model) return `model:${normaliseCode(brand)}:${normaliseCode(model)}`;
  return null;
}

export interface ShopOffer {
  id: string;
  merchant: string;
  price: number;
  url: string;
}

export interface OfferGroup {
  model: string;
  offers: ShopOffer[];
}

/** Groups that are sold by at least two merchants. */
export function matchOffers(products: Product[]): OfferGroup[] {
  const groups = new Map<string, OfferGroup>();
  for (const product of products) {
    const key = matchKey(product);
    if (!key) continue;
    const group = groups.get(key) ?? { model: key, offers: [] };
    group.offers.push({ id: product.id, merchant: product.merchant, price: product.price, url: product.url });
    groups.set(key, group);
  }
  return [...groups.values()].filter((group) => new Set(group.offers.map((offer) => offer.merchant)).size >= 2);
}

/** Other merchants selling the same item, and the lowest of their prices. */
export function otherShops(product: Product, groups: OfferGroup[]): { count: number; low: number } | null {
  const key = matchKey(product);
  const group = groups.find((item) => item.model === key);
  if (!group) return null;
  const others = group.offers.filter((offer) => offer.merchant !== product.merchant);
  if (others.length === 0) return null;
  return {
    count: new Set(others.map((offer) => offer.merchant)).size,
    low: Math.min(...others.map((offer) => offer.price)),
  };
}
