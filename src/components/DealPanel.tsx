import type { Cohort, Confidence, DealTier } from '../lib/deal';

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
  cohort: Cohort;
  price: number;
  /** Our estimate (cars) or the group median (products), drawn as a tick on the strip. */
  reference: number;
  referenceLabel: string;
  rankText: string;
  stripLabel: string;
  confidence: Confidence;
  confidenceText: string;
  confidenceLabel: string;
}

const W = 240;
const H = 30;
const PAD = 8;

/**
 * One dot per comparable listing on a price line, this one highlighted, the reference as a tick.
 * Below it: where this one ranks, and how firm the comparison is.
 */
export function DealPanel({ cohort, price, reference, referenceLabel, rankText, stripLabel, confidence, confidenceText, confidenceLabel }: PanelProps) {
  const values = [...cohort.prices, reference];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (v: number) => (max === min ? W / 2 : PAD + ((v - min) / (max - min)) * (W - 2 * PAD));
  // Thin the dots on big cohorts so the strip stays readable.
  const step = Math.max(1, Math.ceil(cohort.prices.length / 60));
  const dots = cohort.prices.filter((_, i) => i % step === 0);
  const refX = x(reference);

  return (
    <div className="deal-panel">
      <svg className="deal-strip" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={stripLabel} preserveAspectRatio="none">
        <line x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} className="deal-strip-axis" />
        {dots.map((p, i) => (
          <circle key={i} cx={x(p)} cy={H / 2} r={3} className="deal-strip-dot" />
        ))}
        <line x1={refX} x2={refX} y1={4} y2={H - 4} className="deal-strip-ref" />
        <circle cx={x(price)} cy={H / 2} r={6.5} className="deal-strip-this" />
      </svg>
      <div className="deal-strip-scale" aria-hidden="true">
        <span>{formatNzd(min)}</span>
        <span className="deal-legend">
          <span className="deal-legend-this" />
          <span className="deal-legend-ref" />
          {referenceLabel}
        </span>
        <span>{formatNzd(max)}</span>
      </div>
      <p className="deal-rank">{rankText}</p>
      <p className="deal-confidence">
        <span className="deal-dots" role="img" aria-label={confidenceLabel} data-level={confidence}>
          <span />
          <span />
          <span />
        </span>
        {confidenceText}
      </p>
    </div>
  );
}
