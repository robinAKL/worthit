import { describe, expect, it } from 'vitest';
import bonds from '../data/rent-bonds.json';
import { checkRent, type RentDataset } from './rent';

const sample: RentDataset = {
  month: '2026-09',
  bedroomSplit: false,
  attribution: 'MBIE',
  areas: [
    {
      name: 'Sample District',
      month: '2026-09',
      bedrooms: 'all',
      lower: 400,
      median: 500,
      upper: 650,
      count: 30,
    },
    {
      name: 'Quiet District',
      month: '2026-09',
      bedrooms: 'all',
      lower: null,
      median: null,
      upper: null,
      count: 3,
    },
  ],
};

describe('checkRent', () => {
  it('places a weekly rent in the four bond bands', () => {
    expect(checkRent('Sample District', 'all', 399, sample)).toMatchObject({ status: 'band', band: 'below' });
    expect(checkRent('Sample District', 'all', 400, sample)).toMatchObject({ status: 'band', band: 'lower-to-median' });
    expect(checkRent('Sample District', 'all', 500, sample)).toMatchObject({ status: 'band', band: 'lower-to-median' });
    expect(checkRent('Sample District', 'all', 501, sample)).toMatchObject({ status: 'band', band: 'median-to-upper' });
    expect(checkRent('Sample District', 'all', 650, sample)).toMatchObject({ status: 'band', band: 'median-to-upper' });
    expect(checkRent('Sample District', 'all', 651, sample)).toMatchObject({ status: 'band', band: 'above' });
  });

  it('returns insufficient when the sample is suppressed', () => {
    expect(checkRent('Quiet District', 'all', 450, sample)).toMatchObject({ status: 'insufficient' });
  });

  it('does not invent a bedroom split and flags one-bedroom records', () => {
    const result = checkRent('Sample District', 1, 450, sample);
    expect(result.status).toBe('unsplit');
    expect(result.oneBedroomCaution).toBe(true);
    expect(checkRent('Sample District', 2, 450, sample).oneBedroomCaution).toBe(false);
  });

  it('loads the September 2026 territorial-authority file', () => {
    expect(bonds.month).toBe('2026-09');
    expect(bonds.bedroomSplit).toBe(false);
    expect(bonds.attribution).toBe('MBIE');
    expect(bonds.licence).toBe('CC BY 3.0 NZ');
    expect(bonds.areas.find((area) => area.name === 'Wellington City')?.median).toBeGreaterThan(0);
    const live = checkRent('New Zealand', 'all', 400);
    expect(live).toMatchObject({ status: 'band', band: 'below', lower: 495 });
  });
});
