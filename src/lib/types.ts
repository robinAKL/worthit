/**
 * WorthIt shared contract.
 *
 * The UI only talks to `search()` through these types. Data sources
 * (fixtures today, merchant feeds or allow-listed collectors later) must
 * produce `Product` records; nothing in the UI should know where a record
 * came from beyond the `fixture` / `source` fields.
 */

/** The three ranking lanes. `value` is the default. */
export type Lane = 'value' | 'cheap' | 'refined';

export const LANES: readonly Lane[] = ['value', 'cheap', 'refined'] as const;

export type Condition = 'new' | 'refurbished' | 'used';

/** Where a price band sits relative to comparable items in the same category. */
export type Band = 'low' | 'mid' | 'high';

export interface Product {
  id: string;
  title: string;
  /** Stable category slug, e.g. `laptop`, `phone`, `furniture`. */
  category: string;
  /** Price in NZD, GST inclusive. */
  price: number;
  /** Previous price if the merchant shows one, NZD. */
  wasPrice?: number;
  /** Merchant display name. Fixtures must use placeholder names only. */
  merchant: string;
  /** Outbound link to the merchant's own product page. */
  url: string;
  imageUrl?: string;
  /** How many photos the listing has. 0 means no photos. */
  imageCount: number;
  condition: Condition;
  /** Free-form spec map, e.g. { ram: '16 GB', storage: '512 GB' }. */
  specs: Record<string, string | number>;
  /** Average rating 0 to 5, if known. */
  rating?: number;
  reviewCount?: number;
  warrantyMonths?: number;
  /** ISO date the price was captured. */
  capturedAt: string;
  /** Where the record came from. */
  source: 'fixture' | 'feed';
  /** True for sample data. v0.1 only ships fixtures. */
  fixture: boolean;
}

export interface ParsedQuery {
  raw: string;
  keywords: string[];
  category?: string;
  /** Upper budget in NZD, if the query states one. */
  budgetMax?: number;
}

export interface Recommendation {
  product: Product;
  lane: Lane;
  /** Lane score, higher is better. Only comparable within one result set. */
  score: number;
  band: Band;
  /** One plain sentence explaining why this item is in this lane. */
  reason: string;
}

export interface SearchResult {
  query: ParsedQuery;
  lane: Lane;
  items: Recommendation[];
  /** Items that matched the query but were excluded from this lane (missing photos/specs, risk signals). */
  excludedCount: number;
  /** True when every item in the result is sample data. */
  fixture: boolean;
}

export type SearchFn = (query: string, lane: Lane) => SearchResult;
