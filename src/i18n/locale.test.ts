import { describe, expect, it } from 'vitest';
import { matchLocale, resolveLocale } from './index';
import { DICTIONARIES } from './registry';

describe('language selection', () => {
  it('opens shared language links ahead of a saved choice and browser preference', () => {
    expect(resolveLocale('en', 'zh-Hans', 'zh-NZ')).toBe('en');
    expect(resolveLocale('zh-Hans', 'en', 'en-NZ')).toBe('zh-Hans');
  });
  it('uses a saved selection before browser language', () => {
    expect(resolveLocale(null, 'en', 'zh-CN')).toBe('en');
  });
  it('matches regional and case variants without presenting an unsupported language', () => {
    expect(matchLocale('ZH-tw')).toBe('zh-Hans');
    expect(matchLocale('en-NZ')).toBe('en');
    expect(matchLocale('fr')).toBeUndefined();
  });
  it('falls through invalid or missing preferences and ultimately defaults to English', () => {
    expect(resolveLocale('invalid', 'bad', 'zh-CN')).toBe('zh-Hans');
    expect(resolveLocale('invalid', null, 'fr-FR')).toBe('en');
    expect(resolveLocale()).toBe('en');
  });
  it('keeps translated plurals and demo notices readable', () => {
    expect(DICTIONARIES.en.results.count(1)).toBe('1 item');
    expect(DICTIONARIES.en.results.count(2)).toBe('2 items');
    expect(DICTIONARIES.en.results.notice).toContain('Sample data');
    expect(DICTIONARIES['zh-Hans'].results.notice).toContain('示例数据');
  });
});
