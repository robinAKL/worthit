import type { DealTier } from '../lib/deal';

const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 });
export const formatNzd = (n: number) => nzd.format(n);

/** Coloured tier pill. Sits on the image slot so it is the first thing the eye lands on. */
export function DealBadge({ tier, label }: { tier: DealTier; label: string }) {
  return (
    <span className="deal-badge" data-tier={tier}>
      <span className="deal-badge-icon" aria-hidden="true">
        {tier === 'well-below' || tier === 'below' ? '↓' : tier === 'near' ? '≈' : '↑'}
      </span>
      {label}
    </span>
  );
}

/** "$3,200 under our estimate", coloured only when it is good news. */
export function DealDelta({ tier, text }: { tier: DealTier; text: string }) {
  return (
    <span className="deal-delta" data-tier={tier}>
      {text}
    </span>
  );
}

interface PanelProps {
  /** 1-based place in this comparison group. The first three get a visible mark. */
  rank: number;
  placeMark?: string;
  rankText: string;
  confidenceText: string;
}

/** Where this price sits in its group, in words. The first three places are marked. */
export function DealPanel({ rank, placeMark, rankText, confidenceText }: PanelProps) {
  return (
    <div className="deal-panel">
      {rank <= 3 && placeMark ? <p className="rank-mark">{placeMark}</p> : null}
      <p className="deal-rank">{rankText}</p>
      {confidenceText ? <p className="deal-confidence">{confidenceText}</p> : null}
    </div>
  );
}
