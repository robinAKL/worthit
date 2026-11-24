import type { ParsedQuery } from './types';

const CATEGORIES: { category: string; pattern: RegExp }[] = [
  { category: 'laptop', pattern: /笔记本|手提电脑|laptop|notebook/i },
  { category: 'phone', pattern: /手机|phone/i },
  { category: 'furniture', pattern: /家具|书桌|椅子|沙发|餐桌|desk|chair|sofa/i },
];

const BUDGET =
  /(?:预算|不超过|少于|under|below|以内)?\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:刀|纽币|nzd|元|块)?(?:\s*(?:以内|以下|内))?/i;

const WAN = /(\d+(?:\.\d+)?)\s*万/;

const CAR_INTENT = /二手车|汽车|\bcars?\b/gi;

const FILLER =
  /笔记本|手提电脑|laptop|notebook|手机|phone|家具|书桌|椅子|沙发|餐桌|desk|chair|sofa|以内|以下|适合|一个|我想要|想要|预算|不超过|刀|纽币|nzd|元|块|的|和|与/gi;

export function parseQuery(input: string): ParsedQuery {
  const raw = input.trim();
  const kind = /二手车|汽车|\bcars?\b/i.test(raw) ? 'car' : 'product';
  const category = kind === 'car' ? undefined : CATEGORIES.find((entry) => entry.pattern.test(raw))?.category;
  const wan = raw.match(WAN);
  const budgetMatch = wan ? null : raw.match(BUDGET);
  const budgetMax = wan
    ? Number(wan[1]) * 10000
    : budgetMatch
      ? Number(budgetMatch[1].replace(/,/g, ''))
      : undefined;
  const keywords = raw
    .replace(WAN, ' ')
    .replace(BUDGET, ' ')
    .replace(CAR_INTENT, ' ')
    .replace(FILLER, ' ')
    .split(/[\s,，。]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 1);

  return {
    raw,
    keywords: [...new Set(keywords)],
    kind,
    ...(category ? { category } : {}),
    ...(budgetMax !== undefined && Number.isFinite(budgetMax) ? { budgetMax } : {}),
  };
}
