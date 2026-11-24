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
  source: 'rules' | 'ai';
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
  }
  return spec;
}

/**
 * Accept an AI-extracted spec only if every value it claims can be found in the title.
 * Returns the cleaned spec, or null when nothing survives.
 */
export function verifySpec(title: string, raw: { family?: string; style?: string; size?: number; unit?: string; evidence?: Record<string, string> }): ProductSpec | null {
  const lower = title.toLowerCase();
  const ev = raw.evidence ?? {};
  const family = raw.family as Family | undefined;
  if (!family || !ev.family || !lower.includes(ev.family.toLowerCase())) return null;
  const spec: ProductSpec = { family, source: 'ai', evidence: { family: ev.family } };
  if (raw.style && ev.style && lower.includes(ev.style.toLowerCase())) {
    spec.style = raw.style;
    spec.evidence.style = ev.style;
  }
  const unit = FAMILY_UNIT[family];
  if (unit && raw.size !== undefined && ev.size && lower.includes(ev.size.toLowerCase()) && ev.size.includes(String(raw.size))) {
    spec.size = raw.size;
    spec.unit = unit;
    spec.evidence.size = ev.size;
  }
  return spec;
}

/** Price per unit (e.g. NZD per litre), or undefined when the size is unknown. */
export function unitPrice(price: number, spec?: ProductSpec): number | undefined {
  if (!spec?.size || !spec.unit) return undefined;
  return price / spec.size;
}
