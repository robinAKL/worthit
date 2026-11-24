/**
 * The model is asked to put a one-sentence verdict on line one, then a blank line and the
 * explanation. If it ignores that, the first sentence becomes the verdict.
 */
export function splitVerdict(text: string): { verdict: string; rest: string } {
  const trimmed = text.trim();
  const lines = trimmed.split(/\n\s*\n|\n/);
  if (lines.length > 1) return { verdict: lines[0].trim(), rest: lines.slice(1).join(' ').replace(/\s+/g, ' ').trim() };
  // One paragraph: split after the first sentence end (., !, ? or 。！？), keeping any [F1] citations with it.
  const m = /^(.+?[.!?。！？](?:\s*\[F\d{1,2}\])*)\s*(.*)$/s.exec(trimmed);
  if (m && m[2]) return { verdict: m[1].trim(), rest: m[2].trim() };
  return { verdict: trimmed, rest: '' };
}
