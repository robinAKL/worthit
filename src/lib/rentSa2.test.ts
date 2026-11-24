import { describe, expect, it } from 'vitest';
import bonds from '../data/rent-bonds.json';
import sa2 from '../data/rent-sa2.json';
import type { RentDataset } from './rent';
import { checkSuburbRent, type Sa2Dataset } from './rentSa2';

const areas: RentDataset = {
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

const fixture = {
  quarter: '2026-07-01',
  suburbs: [
    {
      code: '1',
      name: 'Sample Suburb',
      ta: 'Sample District',
      cells: { 'House|2': [400, 500, 650, 30] },
    },
    {
      code: '2',
      name: 'Quiet Suburb',
      ta: 'Quiet District',
      cells: { 'House|1': [100, 200, 300, 4] },
    },
  ],
} as unknown as Sa2Dataset;

describe('checkSuburbRent', () => {
  it('reads one published cell and does not borrow another suburb', () => {
    expect(checkSuburbRent('1', 'House', '2', 399, fixture, areas)).toMatchObject({
      status: 'band',
      band: 'below',
      lower: 400,
      median: 500,
      upper: 650,
      count: 30,
    });
    expect(checkSuburbRent('1', 'House', '2', 500, fixture, areas)).toMatchObject({ status: 'band', band: 'lower-to-median' });
    expect(checkSuburbRent('1', 'House', '2', 650, fixture, areas)).toMatchObject({ status: 'band', band: 'median-to-upper' });
    expect(checkSuburbRent('1', 'House', '2', 651, fixture, areas)).toMatchObject({ status: 'band', band: 'above' });
  });

  it('returns insufficient and falls back to the territorial all-bedroom row', () => {
    const missing = checkSuburbRent('1', 'House', '1', 450, fixture, areas);
    expect(missing).toMatchObject({
      status: 'insufficient',
      oneBedroomCaution: true,
      fallback: { status: 'band', band: 'lower-to-median', area: 'Sample District', lower: 400 },
    });
    const suppressed = checkSuburbRent('2', 'House', '1', 450, fixture, areas);
    expect(suppressed).toMatchObject({
      status: 'insufficient',
      fallback: { status: 'insufficient', area: 'Quiet District' },
    });
  });

  it('keeps the July 2026 Berhampore and Karori Park rows separate', () => {
    const berhampore = sa2.suburbs.find((suburb) => suburb.code === '253300');
    const karori = sa2.suburbs.find((suburb) => suburb.code === '249400');
    expect(berhampore?.cells['House|2']).toEqual([585, 630, 630, 57]);
    expect(karori?.cells['House|2']).toEqual([620, 620, 625, 78]);
    expect(checkSuburbRent('253300', 'House', '2', 584)).toMatchObject({
      status: 'band',
      band: 'below',
      suburb: 'Berhampore',
      ta: 'Wellington City',
      lower: 585,
      median: 630,
      count: 57,
    });
    expect(checkSuburbRent('253300', 'House', '2', 630)).toMatchObject({ status: 'band', band: 'lower-to-median' });
    expect(checkSuburbRent('249400', 'House', '2', 620).status === 'band' && checkSuburbRent('249400', 'House', '2', 620)).toMatchObject({
      median: 620,
    });
    const absent = checkSuburbRent('253300', 'Boarding House', '6', 500);
    expect(absent).toMatchObject({
      status: 'insufficient',
      fallback: { status: 'band', area: 'Wellington City' },
    });
    expect(checkSuburbRent('253300', 'ALL', '1', 500).oneBedroomCaution).toBe(true);
    expect(checkSuburbRent('253300', 'House', '2', 600).oneBedroomCaution).toBe(false);
    expect(sa2.quarter).toBe('2026-07-01');
    expect(sa2.countField).toBe('Active Bonds');
    expect(sa2.licence).toBe('CC BY 3.0 NZ');
    expect(sa2.geographyLicence).toBe('CC BY 4.0');
    expect(sa2.geographyAttribution).toBe('Stats NZ');
    expect(sa2.suburbs).toHaveLength(2255);
    expect(bonds.areas.find((area) => area.name === 'Wellington City')?.lower).toBeGreaterThan(0);
  });
});
