import type { Locale } from '../i18n';
import type { Product } from './types';
import { familyName } from './specCompare';

/**
 * What a product card shows when we have no permission to use the merchant's photo:
 * one key figure in large type, the brand, and what kind of product it is.
 * It is information, not a picture, so nobody mistakes it for the item itself.
 */
export interface SpecTile {
  /** e.g. "310 L", "8 kg", "14″ · 32 GB", "15–36 kg". Absent when nothing reliable was found. */
  figure?: string;
  /** e.g. "Bottom-mount fridge", "Booster seat". */
  detail: string;
  brand?: string;
}

const CATEGORY_NAME: Record<Locale, Record<string, string>> = {
  en: {
    whiteware: 'Whiteware',
    'booster-seats': 'Booster seat',
    carseats: 'Car seat',
    'carseat-accessories': 'Car seat accessory',
    'stroller-accessories': 'Stroller accessory',
    '4-wheel-strollers': 'Stroller',
    'toilet-training': 'Toilet training',
    wraps: 'Baby wrap',
    'towels-face-washers': 'Towel & face washer',
    laptop: 'Laptop',
    phone: 'Phone',
    furniture: 'Furniture',
  },
  'zh-Hans': {
    whiteware: '家电',
    'booster-seats': '增高座椅',
    carseats: '儿童安全座椅',
    'carseat-accessories': '安全座椅配件',
    'stroller-accessories': '婴儿车配件',
    '4-wheel-strollers': '婴儿车',
    'toilet-training': '如厕训练',
    wraps: '襁褓巾',
    'towels-face-washers': '毛巾与洗脸巾',
    laptop: '笔记本电脑',
    phone: '手机',
    furniture: '家具',
  },
};

const STYLE_NAME: Record<Locale, Record<string, string>> = {
  en: {
    'french-door': 'French-door',
    'side-by-side': 'Side-by-side',
    'bottom-mount': 'Bottom-mount',
    'top-mount': 'Top-mount',
    bar: 'Bar',
    chest: 'Chest',
    upright: 'Upright',
    'front-load': 'Front-load',
    'top-load': 'Top-load',
    'heat-pump': 'Heat-pump',
    condenser: 'Condenser',
    vented: 'Vented',
    booster: 'Booster',
    convertible: 'Convertible',
    'single-door': 'Single-door',
  },
  'zh-Hans': {
    'french-door': '法式多门',
    'side-by-side': '对开门',
    'bottom-mount': '下冷冻',
    'top-mount': '上冷冻',
    bar: '小型',
    chest: '卧式',
    upright: '立式',
    'front-load': '滚筒',
    'top-load': '波轮',
    'heat-pump': '热泵',
    condenser: '冷凝式',
    vented: '排气式',
    booster: '增高',
    convertible: '可转换',
    'single-door': '单门',
  },
};

const SINGULAR: Record<string, string> = {
  fridges: 'fridge',
  freezers: 'freezer',
  washers: 'washer',
  dryers: 'dryer',
  microwaves: 'microwave',
  dishwashers: 'dishwasher',
  ovens: 'oven',
  laptops: 'laptop',
};

const RANGE_UNIT: Record<Locale, Record<'kg' | 'cm' | 'years' | 'months', string>> = {
  en: { kg: 'kg', cm: 'cm', years: 'yrs', months: 'mths' },
  'zh-Hans': { kg: '公斤', cm: '厘米', years: '岁', months: '个月' },
};

function trimNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

/** A number and unit stated in the title, used only when no structured spec was read. */
export function figureFromTitle(title: string, locale: Locale): string | undefined {
  const litres = /\b(\d{2,4}(?:\.\d)?)\s?(?:L|litres?|liters?)\b/i.exec(title);
  if (litres) return `${trimNumber(Number(litres[1]))} ${locale === 'zh-Hans' ? '升' : 'L'}`;
  const kilos = /\b(\d{1,2}(?:\.\d)?)\s?kg\b/i.exec(title);
  if (kilos) return `${trimNumber(Number(kilos[1]))} ${locale === 'zh-Hans' ? '公斤' : 'kg'}`;
  const inches = /\b(\d{2}(?:\.\d)?)\s?(?:["″]|-?inch\b|in\b)/i.exec(title);
  if (inches) return `${trimNumber(Number(inches[1]))}″`;
  return undefined;
}

function figureFor(p: Pick<Product, 'title' | 'spec'>, locale: Locale): string | undefined {
  const s = p.spec;
  if (s?.size && s.unit) {
    const unit = s.unit === 'L' ? (locale === 'zh-Hans' ? '升' : 'L') : s.unit === 'kg' ? (locale === 'zh-Hans' ? '公斤' : 'kg') : locale === 'zh-Hans' ? '套' : 'place';
    return `${trimNumber(s.size)} ${unit}`;
  }
  if (s?.screenIn || s?.ramGb) {
    return [s.screenIn ? `${trimNumber(s.screenIn)}″` : null, s.ramGb ? `${s.ramGb} GB` : null].filter(Boolean).join(' · ');
  }
  if (s?.range) return `${trimNumber(s.range.min)}–${trimNumber(s.range.max)} ${RANGE_UNIT[locale][s.range.unit]}`;
  const fromTitle = figureFromTitle(p.title, locale);
  if (fromTitle) return fromTitle;
  if (s?.iSize) return 'i-Size';
  return undefined;
}

function detailFor(p: Pick<Product, 'category' | 'spec'>, locale: Locale): string {
  const s = p.spec;
  const family = s?.family ? familyName(s.family, locale) : undefined;
  // familyName returns the key unchanged when it has no name, e.g. car-seat or accessory: use the category then.
  if (s && family && family !== s.family) {
    const noun = locale === 'en' ? (SINGULAR[family] ?? family) : family;
    const style = s.style ? STYLE_NAME[locale][s.style] : undefined;
    if (style) return locale === 'en' ? `${style} ${noun}` : `${style}${noun}`;
    return locale === 'en' ? noun.charAt(0).toUpperCase() + noun.slice(1) : noun;
  }
  const named = CATEGORY_NAME[locale][p.category];
  if (named) return named;
  const plain = p.category.replace(/-/g, ' ');
  return plain.charAt(0).toUpperCase() + plain.slice(1);
}

export function specTile(p: Pick<Product, 'title' | 'category' | 'spec' | 'specs'>, locale: Locale): SpecTile {
  const brand = typeof p.specs?.brand === 'string' && p.specs.brand.trim() ? p.specs.brand.trim() : undefined;
  return { figure: figureFor(p, locale), detail: detailFor(p, locale), brand };
}
