import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from '../../i18n';
import { carResults } from './index';
import { carReason } from './reason';

/** WorthIt copy never claims a superlative it cannot prove. */
const BANNED = /\bcheapest\b|\bbest\b|最便宜|最优|最低价|全网最/i;

describe('used-car copy', () => {
  it('lane labels, hints and the method note use no superlatives', () => {
    for (const copy of Object.values(DICTIONARIES)) {
      const t = copy.cars;
      const d = copy.deal;
      const text = [
        t.title,
        t.lede,
        t.method,
        ...Object.values(t.lanes).flatMap((l) => [l.label, l.hint]),
        ...Object.values(d.tier.car),
        ...Object.values(d.tier.product),
        d.under('$100', 'car'),
        d.under('$100', 'product'),
        d.over('$100', 'car'),
        d.near('car'),
        d.near('product'),
        d.rankModel(1, 5, 'Toyota Aqua', 2014, 2018),
        d.rankNone,
        d.rankSegment(1, 5, d.body.hatch, 2016, 2020),
        d.rankGroup(1, 5),
        d.mixed('$1', '$2'),
        d.mixedNote,
        d.confidence.car(3, 9, 300),
        d.confidence.product(2, 6),
        d.notEnough(2),
      ].join(' ');
      expect(text).not.toMatch(BANNED);
    }
  });

  it('reasons for the first cards in every lane use no superlatives', () => {
    for (const lane of ['value', 'cheap', 'refined'] as const) {
      for (const pick of carResults(lane).picks.slice(0, 20)) {
        for (const locale of ['en', 'zh-Hans'] as const) expect(carReason(pick, locale)).not.toMatch(BANNED);
      }
    }
  });
});
