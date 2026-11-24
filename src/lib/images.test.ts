// @ts-nocheck
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALLOWED_LICENCE, NOT_STOCK, pickImage } from '../../scripts/enrich/model-photos.mjs';
import { carArt, productArt } from '../components/art/kind';
import { OPEN_LICENCE } from './modelPhotos';
import manifest from '../data/model-photos.json';
import { keepVehicleFacts } from '../../scripts/collect/core/facts.mjs';

const page = (title, licence, w = 1200, h = 700) => ({
  title,
  imageinfo: [{ thumburl: `https://upload.wikimedia.org/thumb/${encodeURIComponent(title)}.jpg`, width: w, height: h, descriptionurl: 'https://commons.wikimedia.org/wiki/x', extmetadata: { LicenseShortName: { value: licence }, Artist: { value: '<a href="#">Someone</a>' } } }],
});

describe('our own illustrations', () => {
  it('has a drawing for every car body and a fallback', () => {
    for (const body of ['hatch', 'sedan', 'wagon', 'suv', 'ute', 'van', 'coupe']) expect(carArt(body)).toBe(body);
    expect(carArt('other')).toBe('hatch');
  });

  it('maps product families and categories, with a generic fallback', () => {
    expect(productArt({ category: 'whiteware', spec: { family: 'fridge' } })).toBe('fridge');
    expect(productArt({ category: 'whiteware', spec: { family: 'washer' } })).toBe('washer');
    expect(productArt({ category: 'laptop' })).toBe('laptop');
    expect(productArt({ category: '4-wheel-strollers' })).toBe('stroller');
    expect(productArt({ category: 'booster-seats' })).toBe('car-seat');
    expect(productArt({ category: 'towels-face-washers' })).toBe('towel');
    expect(productArt({ category: 'toilet-training' })).toBe('generic');
  });
});

describe('model photos from Wikimedia Commons', () => {
  it('accepts only open licences', () => {
    for (const ok of ['CC0', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 2.0 de', 'Public domain']) expect(ALLOWED_LICENCE.test(ok)).toBe(true);
    for (const no of ['All rights reserved', 'CC BY-NC 2.0', 'CC BY-ND 4.0', 'Fair use', '']) expect(ALLOWED_LICENCE.test(no)).toBe(false);
  });

  it('picks an exterior, landscape, openly licensed photo naming the make and model', () => {
    const pages = [
      page('File:Toyota Aqua interior.jpg', 'CC BY-SA 4.0'),
      page('File:Toyota Aqua NC.jpg', 'CC BY-NC 2.0'),
      page('File:Toyota Aqua tall.jpg', 'CC0', 600, 900),
      page('File:Toyota Prius C.jpg', 'CC0'),
      page('File:2nd generation Toyota Aqua Z.jpg', 'CC0'),
    ];
    expect(pickImage(pages, 'Toyota', 'Aqua')).toMatchObject({ title: 'File:2nd generation Toyota Aqua Z.jpg', license: 'CC0', author: 'Someone' });
    expect(pickImage(pages.slice(0, 4), 'Toyota', 'Aqua')).toBeNull();
  });

  it('skips race, rally, concept and emergency-service cars, by whole word', () => {
    for (const bad of ['2006 BMW 120i SE Circuit Rally 2', 'Toyota FT-86 II concept', 'fire service Toyota Hilux', 'Subaru WRX STI at the Adelaide Rally']) expect(NOT_STOCK.test(bad)).toBe(true);
    for (const ok of ['Honda GRACE LX front', 'Toyota Vellfire, Johor Bahru', 'Toyota HiLux GR Sport']) expect(NOT_STOCK.test(ok)).toBe(false);
    expect(Object.values(manifest).filter(Boolean).every((e) => !NOT_STOCK.test(e.title.replace(/[_-]/g, ' ')))).toBe(true);
  });

  it('every photo in the manifest has an open licence, an author and a source, and the file exists', () => {
    const files = new Set(readdirSync(new URL('../../public/model-photos/', import.meta.url)));
    for (const entry of Object.values(manifest)) {
      if (!entry) continue;
      expect(OPEN_LICENCE.test(entry.license)).toBe(true);
      expect(entry.author).toBeTruthy();
      expect(entry.source).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(files.has(entry.file.replace('/model-photos/', ''))).toBe(true);
    }
  });
});

describe("dealers' own photos stay off without permission", () => {
  it('drops imageUrl unless the adapter declares permission', () => {
    const row = { make: 'Toyota', model: 'Aqua', year: 2017, priceNzd: 9990, url: 'https://d.example/1', imageUrl: 'https://d.example/1.jpg' };
    expect(keepVehicleFacts(row).imageUrl).toBeUndefined();
    expect(keepVehicleFacts(row, { imagePermission: true }).imageUrl).toBe('https://d.example/1.jpg');
  });
});
