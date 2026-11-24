import type { ParsedQuery } from './types';

const CATEGORIES: { category: string; pattern: RegExp }[] = [
  { category: 'laptop', pattern: /笔记本|手提电脑|laptop|notebook/i },
  { category: 'phone', pattern: /手机|phone/i },
  { category: 'furniture', pattern: /家具|书桌|椅子|沙发|餐桌|desk|chair|sofa/i },
];

const BUDGET =
  /(?:预算|不超过|少于|under|below)?\s*\$?\s*(\d{2,6}(?:\.\d+)?)\s*(?:刀|纽币|nzd|元|块)?(?:\s*(?:以内|以下|内))?/i;

const FILLER =
  /笔记本|手提电脑|laptop|notebook|手机|phone|家具|书桌|椅子|沙发|餐桌|desk|chair|sofa|以内|以下|适合|一个|我想要|想要|预算|不超过|刀|纽币|nzd|元|块|的|和|与/gi;

export function parseQuery(input: string): ParsedQuery {
  const raw = input.trim();
  const category = CATEGORIES.find((entry) => entry.pattern.test(raw))?.category;
  const budgetMatch = raw.match(BUDGET);
  const budgetMax = budgetMatch ? Number(budgetMatch[1]) : undefined;
  const keywords = raw
    .replace(BUDGET, ' ')
    .replace(FILLER, ' ')
    .split(/[\s,，。]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 1);

  return {
    raw,
    keywords: [...new Set(keywords)],
    ...(category ? { category } : {}),
    ...(budgetMax !== undefined && Number.isFinite(budgetMax) ? { budgetMax } : {}),
  };
}
