import type { BodyClass } from '../../lib/cars/model';
import type { Product } from '../../lib/types';
import type { ArtKind } from './Art';

const BODY_ART: Record<BodyClass, ArtKind> = {
  hatch: 'hatch',
  sedan: 'sedan',
  wagon: 'wagon',
  suv: 'suv',
  ute: 'ute',
  van: 'van',
  coupe: 'coupe',
  other: 'hatch',
};

export function carArt(body: BodyClass): ArtKind {
  return BODY_ART[body] ?? 'hatch';
}

const FAMILY_ART: Record<string, ArtKind> = {
  fridge: 'fridge',
  freezer: 'freezer',
  washer: 'washer',
  dryer: 'dryer',
  microwave: 'microwave',
  dishwasher: 'dishwasher',
  oven: 'oven',
  cooktop: 'cooktop',
  laptop: 'laptop',
  'car-seat': 'car-seat',
};

/** Spec family first, then the category name; anything else gets the generic box. */
export function productArt(product: Pick<Product, 'category' | 'spec'>): ArtKind {
  const family = product.spec?.family;
  if (family && FAMILY_ART[family]) return FAMILY_ART[family];
  const c = product.category.toLowerCase();
  if (c.includes('laptop')) return 'laptop';
  if (c.includes('phone')) return 'phone';
  if (/stroller|pram|pushchair/.test(c)) return 'stroller';
  if (/car-?seat|booster/.test(c)) return 'car-seat';
  if (/towel|wrap|washer-?cloth|face-washer/.test(c)) return 'towel';
  if (/furniture|desk|sofa|chair|table/.test(c)) return 'furniture';
  return 'generic';
}
