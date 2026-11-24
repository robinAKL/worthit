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
      const text = [t.title, t.lede, t.method, ...Object.values(t.lanes).flatMap((l) => [l.label, l.hint])].join(' ');
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
