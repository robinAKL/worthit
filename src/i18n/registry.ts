import { en, type Copy } from './en';
import { zhHans } from './zh-Hans';
import type { Locale } from '../lib/types';

/** The data layer owns locale IDs; every supported locale needs a complete dictionary. */
export const DICTIONARIES = { en, 'zh-Hans': zhHans } satisfies Record<Locale, Copy>;
