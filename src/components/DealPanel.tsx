import type { ReactNode } from 'react';
import type { DealTier } from '../lib/deal';
import { stripLayout } from '../lib/strip';

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
  children?: ReactNode;
}

/** Where this price sits in its group, in words. The first three places are marked. */
export function DealPanel({ rank, placeMark, rankText, confidenceText, children }: PanelProps) {
  return (
    <div className="deal-panel">
      {children}
      {rank <= 3 && placeMark ? <p className="rank-mark">{placeMark}</p> : null}
      <p className="deal-rank">{rankText}</p>
      {confidenceText ? <p className="deal-confidence">{confidenceText}</p> : null}
    </div>
  );
}

/** A labelled line: ends are the group's lowest and highest, the dot is this item, the tick is the reference. */
export function PriceStrip({
  prices,
  value,
  marker,
  lowLabel,
  highLabel,
  format,
  caption,
  note,
}: {
  prices: number[];
  value: number;
  /** Omitted for a mixed group: the line stays, the fair-price tick does not. */
  marker?: number;
  lowLabel: (amount: string) => string;
  highLabel: (amount: string) => string;
  format: (n: number) => string;
  /** Rank sentence under the line. Omitted when the group is too mixed to rank. */
  caption?: string;
  /** Spoken when there is no rank sentence, e.g. a mixed group. */
  note?: string;
}) {
  const layout = stripLayout(prices, value, marker);
  if (!layout) return null;
  const lowText = lowLabel(format(layout.low));
  const highText = highLabel(format(layout.high));
  const spoken = [lowText, highText, caption ?? note].filter(Boolean).join('. ');
  return (
    <div className="price-line">
      <div className="price-line-track" role="img" aria-label={spoken}>
        {layout.markerAt !== undefined ? <span className="price-line-fair" style={{ left: `${layout.markerAt}%` }} /> : null}
        <span className="price-line-dot" style={{ left: `${layout.valueAt}%` }} />
      </div>
      <div className="deal-strip-scale">
        <span>{lowText}</span>
        <span>{highText}</span>
      </div>
      {caption ? <p className="deal-rank">{caption}</p> : null}
    </div>
  );
}
