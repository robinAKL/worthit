import type { Fact } from './facts';

/**
 * Every number in an answer must appear in the facts it was given. Small counts (0-10)
 * are allowed, since "two of these" or "3 cars" are not claims about price or size.
 */
export function numbersIn(text: string): string[] {
  return [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => m[0].replace(/,/g, '').replace(/\.0+$/, ''));
}

export function unsupportedNumbers(answer: string, facts: Fact[]): string[] {
  const known = new Set(facts.flatMap((f) => numbersIn(f.text)));
  return numbersIn(answer).filter((n) => !known.has(n) && !(Number(n) <= 10 && /^\d+$/.test(n)));
}

/** Fact ids the answer cites, e.g. [F2], in order of first use, limited to ids we gave. */
export function citedFacts(answer: string, facts: Fact[]): string[] {
  const valid = new Set(facts.map((f) => f.id));
  const seen: string[] = [];
  for (const m of answer.matchAll(/\[(F\d{1,2})\]/g)) if (valid.has(m[1]) && !seen.includes(m[1])) seen.push(m[1]);
  return seen;
}
