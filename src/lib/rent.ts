import bonds from '../data/rent-bonds.json';

export type BedroomCount = 'all' | 1 | 2 | 3 | 4 | '5+';
export type RentBand = 'below' | 'lower-to-median' | 'median-to-upper' | 'above';

export interface RentArea {
  name: string;
  month: string;
  bedrooms: 'all';
  lower: number | null;
  median: number | null;
  upper: number | null;
  count: number | null;
}

export interface RentDataset {
  month: string;
  bedroomSplit: boolean;
  attribution: string;
  areas: RentArea[];
}

export type RentCheckResult =
  | {
      status: 'band';
      band: RentBand;
      area: string;
      month: string;
      lower: number;
      median: number;
      upper: number;
      count: number;
      oneBedroomCaution: boolean;
    }
  | { status: 'insufficient' | 'unsplit' | 'unknown-area' | 'invalid'; area: string; month: string; oneBedroomCaution: boolean };

const dataset = bonds as RentDataset;

export function rentAreaNames(source: RentDataset = dataset): string[] {
  return source.areas.map((area) => area.name);
}

export function checkRent(
  area: string,
  bedrooms: BedroomCount,
  weeklyRent: number,
  source: RentDataset = dataset,
): RentCheckResult {
  const oneBedroomCaution = bedrooms === 1;
  const row = source.areas.find((item) => item.name.toLowerCase() === area.trim().toLowerCase());
  const month = row?.month ?? source.month;
  if (!row) return { status: 'unknown-area', area, month, oneBedroomCaution };
  if (bedrooms !== 'all') return { status: 'unsplit', area: row.name, month, oneBedroomCaution };
  if (!Number.isFinite(weeklyRent) || weeklyRent <= 0) {
    return { status: 'invalid', area: row.name, month, oneBedroomCaution };
  }
  if (
    row.lower === null ||
    row.median === null ||
    row.upper === null ||
    row.count === null ||
    row.count < 5
  ) {
    return { status: 'insufficient', area: row.name, month, oneBedroomCaution };
  }
  const band: RentBand =
    weeklyRent < row.lower
      ? 'below'
      : weeklyRent <= row.median
        ? 'lower-to-median'
        : weeklyRent <= row.upper
          ? 'median-to-upper'
          : 'above';
  return {
    status: 'band',
    band,
    area: row.name,
    month,
    lower: row.lower,
    median: row.median,
    upper: row.upper,
    count: row.count,
    oneBedroomCaution,
  };
}
