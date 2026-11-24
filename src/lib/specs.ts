/**
 * Product specifications that make like-for-like comparison possible.
 *
 * Rules read the title (and category) deterministically. A collection-time AI step
 * (scripts/enrich/specs.mjs) may fill gaps, but only with values found in the title text;
 * its results are cached in src/data/specs/*.json and merged here.
 */

export type Family =
  | 'fridge'
  | 'freezer'
  | 'washer'
  | 'dryer'
  | 'microwave'
  | 'dishwasher'
  | 'oven'
  | 'cooktop'
  | 'car-seat'
  | 'laptop'
  | 'combo'
  | 'accessory';

/** The size a family is compared on, so price can be read per unit. */
export type Unit = 'L' | 'kg' | 'place';

export interface ProductSpec {
  family: Family;
  /** e.g. french-door, side-by-side, chest, front-load, heat-pump, booster. */
  style?: string;
  /** Capacity in the family's unit (litres, kilograms, place settings). */
  size?: number;
  unit?: Unit;
  /** Car seats: meets the i-Size (R129) standard. */
  iSize?: boolean;
  /** Car seats: ISOFIX connectors. Only set when the text says so; unknown stays undefined. */
  isofix?: boolean;
  /** Car seats: stated use range, e.g. { min: 15, max: 36, unit: 'kg' }. */
  range?: { min: number; max: number; unit: 'kg' | 'cm' | 'years' | 'months' };
  /** Appliances: energy star rating when stated. */
  energyStars?: number;
  /** Laptops. */
  ramGb?: number;
  storageGb?: number;
  screenIn?: number;
  cpuTier?: 'entry' | 'mid' | 'high';
  source: 'rules' | 'ai';
  /** 0-1 per field for AI readings; rules are deterministic and leave this unset. */
  confidence?: Record<string, number>;
  /** Title fragments each value came from. */
  evidence: Record<string, string>;
}

/** Families compared per unit, and the unit they use. */
export const FAMILY_UNIT: Partial<Record<Family, Unit>> = {
  fridge: 'L',
  freezer: 'L',
  microwave: 'L',
  oven: 'L',
  washer: 'kg',
  dryer: 'kg',
  dishwasher: 'place',
};

/** Families that are never ranked against anything (bundles and add-ons). */
export const UNRANKED: ReadonlySet<Family> = new Set(['combo', 'accessory']);

const STYLE_RULES: Array<{ re: RegExp; family: Family; style?: string }> = [
  // Order matters: specific before general.
  { re: /\b(water filter|stacking kit|car seat adapter|adapter|nursing cover|sunshade|head hugger|ride-on board)\b/i, family: 'accessory' },
  { re: /\s\+\s|\bcombo\b/i, family: 'combo' },
  { re: /\bchest freezer\b/i, family: 'freezer', style: 'chest' },
  { re: /\b(compact )?bar freezer\b/i, family: 'freezer', style: 'bar' },
  { re: /\b(single door|vertical|upright) freezer\b/i, family: 'freezer', style: 'upright' },
  { re: /\bbar fridge\b/i, family: 'fridge', style: 'bar' },
  { re: /\bfrench door\b/i, family: 'fridge', style: 'french-door' },
  { re: /\bside-by-side\b/i, family: 'fridge', style: 'side-by-side' },
  { re: /\bbottom mount(ed)? freezer\b/i, family: 'fridge', style: 'bottom-mount' },
  { re: /\btop mount(ed)? freezer\b|\btmf\b/i, family: 'fridge', style: 'top-mount' },
  { re: /\bsingle door refrigerator\b/i, family: 'fridge', style: 'single-door' },
  { re: /\b(refrigerator|fridge)\b/i, family: 'fridge' },
  { re: /\bfreezer\b/i, family: 'freezer' },
  { re: /\bfront-?load washer\b/i, family: 'washer', style: 'front-load' },
  { re: /\btop-?load washer\b/i, family: 'washer', style: 'top-load' },
  { re: /\bwashing machine\b|\bwasher\b/i, family: 'washer' },
  { re: /\bheat pump dryer\b/i, family: 'dryer', style: 'heat-pump' },
  { re: /\bdryer\b/i, family: 'dryer' },
  { re: /\bmicrowave\b/i, family: 'microwave' },
  { re: /\bdishwasher\b/i, family: 'dishwasher' },
  { re: /\bcooktop\b/i, family: 'cooktop' },
  { re: /\boven\b/i, family: 'oven' },
  { re: /\bbooster seat\b/i, family: 'car-seat', style: 'booster' },
  { re: /\b(convertible )?car seat\b/i, family: 'car-seat', style: 'convertible' },
  { re: /\b(laptop|notebook|macbook)\b|笔记本/i, family: 'laptop' },
];

/** Read family, style and size from a product title. Returns null when the title names no known family. */
export function specFromTitle(title: string): ProductSpec | null {
  const rule = STYLE_RULES.find((r) => r.re.test(title));
  if (!rule) return null;
  const evidence: Record<string, string> = { family: title.match(rule.re)![0].trim() };
  const spec: ProductSpec = { family: rule.family, source: 'rules', evidence };
  if (rule.style) spec.style = rule.style;

  const unit = FAMILY_UNIT[rule.family];
  if (unit === 'L') {
    const m = title.match(/\b(\d{2,4})\s?L\b/);
    if (m) {
      spec.size = Number(m[1]);
      evidence.size = m[0];
    }
  } else if (unit === 'kg') {
    const m = title.match(/\b(\d{1,2}(?:\.\d)?)\s?kg\b/i);
    if (m) {
      spec.size = Number(m[1]);
      evidence.size = m[0];
    }
  } else if (unit === 'place') {
    const m = title.match(/\b(\d{1,2})\s?place setting/i);
    if (m) {
      spec.size = Number(m[1]);
      evidence.size = m[0];
    }
  }
  if (spec.size !== undefined) spec.unit = unit;

  if (rule.family === 'car-seat') {
    const iSize = title.match(/\bi-?size\b/i);
    spec.iSize = Boolean(iSize);
    if (iSize) evidence.iSize = iSize[0];
    const isofix = title.match(/\b(isofix|isofit|latch)\b/i);
    if (isofix) {
      spec.isofix = true;
      evidence.isofix = isofix[0];
    }
    const range = title.match(/\b(\d{1,3})\s?(?:-|–|to)\s?(\d{1,3})\s?(kg|cm|years|yrs|months|mths)\b/i);
    if (range) {
      const u = range[3].toLowerCase();
      spec.range = { min: Number(range[1]), max: Number(range[2]), unit: u.startsWith('y') ? 'years' : u.startsWith('m') ? 'months' : (u as 'kg' | 'cm') };
      evidence.range = range[0];
    }
  }

  if (FAMILY_UNIT[rule.family]) {
    const stars = title.match(/\b(\d(?:\.\d)?)\s?(?:energy\s)?stars?\b/i);
    if (stars) {
      spec.energyStars = Number(stars[1]);
      evidence.energyStars = stars[0];
    }
  }

  if (rule.family === 'laptop') Object.assign(spec, laptopFacts(title, evidence));
  return spec;
}

/** RAM, storage, screen and CPU tier from text such as "16GB", "512GB SSD", "14-inch", "14 寸", "Core i7". */
function laptopFacts(text: string, evidence: Record<string, string>): Partial<ProductSpec> {
  const out: Partial<ProductSpec> = {};
  const ram = text.match(/\b(\d{1,3})\s?GB\s?(?:RAM|内存|memory)/i) ?? text.match(/(?:RAM|memory|内存)[:：\s]*(\d{1,3})\s?GB/i);
  if (ram) {
    out.ramGb = Number(ram[1]);
    evidence.ramGb = ram[0];
  }
  const storage = text.match(/\b(\d{1,4})\s?(GB|TB)\s?(?:SSD|storage|存储|硬盘)/i) ?? text.match(/(?:storage|SSD|存储)[:：\s]*(\d{1,4})\s?(GB|TB)/i);
  if (storage) {
    out.storageGb = Number(storage[1]) * (storage[2].toUpperCase() === 'TB' ? 1024 : 1);
    evidence.storageGb = storage[0];
  }
  const screen = text.match(/\b(1[0-8](?:\.\d)?)\s?(?:-?\s?inch|"|”|寸)/i);
  if (screen) {
    out.screenIn = Number(screen[1]);
    evidence.screenIn = screen[0];
  }
  const cpu = text.match(/\b(core\s?i[3579]|ryzen\s?[3579]|celeron|pentium|apple\s?m[1-4]|\bm[1-4]\s?(?:pro|max)?)\b/i);
  if (cpu) {
    const c = cpu[0].toLowerCase();
    out.cpuTier = /celeron|pentium|i3|ryzen\s?3/.test(c) ? 'entry' : /i5|ryzen\s?5|m[1-2]\b/.test(c) ? 'mid' : 'high';
    evidence.cpuTier = cpu[0];
  }
  return out;
}

/** Structured facts the collector kept (JSON-LD brand/model/additionalProperty, or catalogue specs), as one line. */
export function factsText(specs: Record<string, string | number> | undefined): string {
  if (!specs) return '';
  return Object.entries(specs)
    .filter(([k]) => k !== 'note')
    // "memory: 16GB" becomes "16GB RAM" and "storage: 512GB" becomes "512GB storage", so the title rules can read them.
    .map(([k, v]) => {
      const value = String(v);
      if (k === 'memory' && /^\d+\s?GB$/i.test(value)) return `${value} RAM`;
      if (k === 'storage' && /^\d+\s?(GB|TB)$/i.test(value)) return `${value} storage`;
      return `${k}: ${value}`;
    })
    .join(' | ');
}

/**
 * Title first, then the structured facts: a value found only in the facts still counts,
 * and its evidence points at that fact.
 */
export function specFromProduct(product: { title: string; specs?: Record<string, string | number> }): ProductSpec | null {
  const text = [product.title, factsText(product.specs)].filter(Boolean).join(' | ');
  return specFromTitle(text);
}

/** Size band used to compare like with like inside a family, e.g. fridges by capacity. */
export function sizeBand(spec: ProductSpec): string | undefined {
  if ((spec.family === 'fridge' || spec.family === 'freezer') && spec.size) return spec.size < 200 ? 'compact' : spec.size < 450 ? 'mid' : 'large';
  if (spec.family === 'washer' && spec.size) return spec.size < 9 ? 'small' : 'large';
  if (spec.family === 'laptop' && spec.ramGb) return spec.ramGb <= 16 ? 'ram16' : 'ram32';
  return undefined;
}

/**
 * Accept an AI-extracted spec only if every value it claims can be found in the title.
 * Returns the cleaned spec, or null when nothing survives.
 */
/** An AI field below this confidence is dropped. */
export const MIN_AI_CONFIDENCE = 0.6;

export function verifySpec(
  title: string,
  raw: { family?: string; style?: string; size?: number; unit?: string; evidence?: Record<string, string>; confidence?: Record<string, number> },
): ProductSpec | null {
  const lower = title.toLowerCase();
  const ev = raw.evidence ?? {};
  const conf = raw.confidence ?? {};
  const sure = (field: string) => (conf[field] ?? 1) >= MIN_AI_CONFIDENCE;
  const family = raw.family as Family | undefined;
  if (!family || !ev.family || !lower.includes(ev.family.toLowerCase()) || !sure('family')) return null;
  const spec: ProductSpec = { family, source: 'ai', evidence: { family: ev.family }, confidence: {} };
  spec.confidence!.family = conf.family ?? 1;
  if (raw.style && ev.style && lower.includes(ev.style.toLowerCase()) && sure('style')) {
    spec.style = raw.style;
    spec.evidence.style = ev.style;
    spec.confidence!.style = conf.style ?? 1;
  }
  const unit = FAMILY_UNIT[family];
  if (unit && raw.size !== undefined && ev.size && lower.includes(ev.size.toLowerCase()) && ev.size.includes(String(raw.size)) && sure('size')) {
    spec.size = raw.size;
    spec.unit = unit;
    spec.evidence.size = ev.size;
    spec.confidence!.size = conf.size ?? 1;
  }
  return spec;
}

/** Price per unit (e.g. NZD per litre), or undefined when the size is unknown. */
export function unitPrice(price: number, spec?: ProductSpec): number | undefined {
  if (!spec?.size || !spec.unit) return undefined;
  return price / spec.size;
}
