import type { Recommendation } from '../lib/types';
import { copy } from '../copy';

const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 });

interface Props {
  rec: Recommendation;
  /** Where the price sits between the lowest and highest comparable price, 0 to 100. */
  position: number;
}

export function ProductCard({ rec, position }: Props) {
  const { product: p, band, reason } = rec;
  const specs = Object.entries(p.specs)
    .filter(([, v]) => String(v).length <= 14)
    .slice(0, 3);

  return (
    <article className="card">
      <h3 className="card-title">{p.title}</h3>

      <p className="card-price">
        <span className="price">{nzd.format(p.price)}</span>
        {p.wasPrice && p.wasPrice > p.price ? (
          <span className="was">
            {copy.results.was} <s>{nzd.format(p.wasPrice)}</s>
          </span>
        ) : null}
      </p>

      <div className="meter" data-band={band}>
        <div className="meter-track" role="img" aria-label={copy.results.meterLabel(Math.round(position))}>
          <span className="meter-mark" style={{ insetInlineStart: `${position}%` }} />
        </div>
        <p className="meter-caption">{copy.results.band[band]}</p>
      </div>

      <p className="card-reason">{reason}</p>

      <ul className="card-facts">
        <li>{copy.results.condition[p.condition]}</li>
        {specs.map(([k, v]) => (
          <li key={k}>{String(v)}</li>
        ))}
        {p.warrantyMonths ? <li>{copy.results.warranty(p.warrantyMonths)}</li> : null}
        {p.rating ? <li>{copy.results.rating(p.rating, p.reviewCount)}</li> : null}
      </ul>

      <a className="card-link" href={p.url} target="_blank" rel="noopener noreferrer nofollow">
        {copy.results.viewAt(p.merchant)}
        <span className="visually-hidden">（在新窗口打开）</span>
      </a>
    </article>
  );
}
