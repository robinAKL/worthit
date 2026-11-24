import bonds from '../data/rent-bonds.json';
import sa2 from '../data/rent-sa2.json';
import { checkRent, type RentCheckResult, type RentDataset } from './rent';

export interface Sa2Suburb {
  code: string;
  name: string;
  ta: string;
  cells: Record<string, [number, number, number, number]>;
}

export interface Sa2Dataset {
  quarter: string;
  timeFrame: string;
  pageUrl: string;
  sourceUrl: string;
  licence: string;
  licenceUrl: string;
  attribution: string;
  countField: string;
  geographyName: string;
  geographyLayer: string;
  geographyUrl: string;
  geographyLicence: string;
  geographyLicenceUrl: string;
  geographyAttribution: string;
  downloadedAt: string;
  note: string;
  dwellings: string[];
  beds: string[];
  suburbs: Sa2Suburb[];
}

export interface SuburbChoice {
  code: string;
  name: string;
  ta: string;
  label: string;
}

export type SuburbRentResult =
  | {
      status: 'band';
      band: 'below' | 'lower-to-median' | 'median-to-upper' | 'above';
      code: string;
      suburb: string;
      ta: string;
      dwelling: string;
      beds: string;
      quarter: string;
      lower: number;
      median: number;
      upper: number;
      count: number;
      oneBedroomCaution: boolean;
    }
  | {
      status: 'insufficient';
      code: string;
      suburb: string;
      ta: string;
      dwelling: string;
      beds: string;
      quarter: string;
      oneBedroomCaution: boolean;
      fallback: RentCheckResult;
    }
  | { status: 'unknown-suburb' | 'invalid'; quarter: string; oneBedroomCaution: boolean };

const dataset = sa2 as Sa2Dataset;

export function suburbChoices(source: Sa2Dataset = dataset): SuburbChoice[] {
  const counts = new Map<string, number>();
  for (const suburb of source.suburbs) counts.set(suburb.name, (counts.get(suburb.name) ?? 0) + 1);
  return source.suburbs.map((suburb) => ({
    code: suburb.code,
    name: suburb.name,
    ta: suburb.ta,
    label: (counts.get(suburb.name) ?? 0) > 1 ? `${suburb.name}, ${suburb.ta}` : suburb.name,
  }));
}

export function sa2Dwellings(source: Sa2Dataset = dataset): string[] {
  return source.dwellings;
}

export function sa2Beds(source: Sa2Dataset = dataset): string[] {
  return source.beds;
}

export function checkSuburbRent(
  code: string,
  dwelling: string,
  beds: string,
  weeklyRent: number,
  source: Sa2Dataset = dataset,
  areas: RentDataset = bonds as RentDataset,
): SuburbRentResult {
  const quarter = source.quarter;
  const oneBedroomCaution = beds === '1';
  const suburb = source.suburbs.find((item) => item.code === code);
  if (!suburb) return { status: 'unknown-suburb', quarter, oneBedroomCaution };
  if (!Number.isFinite(weeklyRent) || weeklyRent <= 0) {
    return { status: 'invalid', quarter, oneBedroomCaution };
  }
  const cell = suburb.cells[`${dwelling}|${beds}`];
  if (!cell || cell[3] < 5) {
    return {
      status: 'insufficient',
      code: suburb.code,
      suburb: suburb.name,
      ta: suburb.ta,
      dwelling,
      beds,
      quarter,
      oneBedroomCaution,
      fallback: checkRent(suburb.ta, 'all', weeklyRent, areas),
    };
  }
  const [lower, median, upper, count] = cell;
  const band =
    weeklyRent < lower
      ? 'below'
      : weeklyRent <= median
        ? 'lower-to-median'
        : weeklyRent <= upper
          ? 'median-to-upper'
          : 'above';
  return {
    status: 'band',
    band,
    code: suburb.code,
    suburb: suburb.name,
    ta: suburb.ta,
    dwelling,
    beds,
    quarter,
    lower,
    median,
    upper,
    count,
    oneBedroomCaution,
  };
}
