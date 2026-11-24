import { DICTIONARIES, type Copy, type Locale } from '../i18n';
import { countsAsSpec } from '../lib/score';
import type { Recommendation } from '../lib/types';

const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 });

function formatCaptured(locale: Locale, iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DICTIONARIES[locale].language.intlLocale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(date);
}

interface Props {
  copy: Copy;
  locale: Locale;
  rec: Recommendation;
  /** Where the price sits between the lowest and highest comparable price, 0 to 100. */
  position: number;
}

export function ProductCard({ rec, position, copy, locale }: Props) {
  const { product: p, band, reason } = rec;
  const specs = Object.entries(p.specs)
    .map(([key, value]) => [key, p.localizedSpecs?.[locale]?.[key] ?? value] as const)
    .filter(([key, value]) => countsAsSpec(p, key, value) && String(value).length <= 14)
    .slice(0, 3);

  const captured = formatCaptured(locale, p.capturedAt);

  return (
    <article className="card">
      <p className="card-flag">{p.fixture ? copy.results.sampleFlag : copy.results.capturedPrice(captured)}</p>
      <h3 className="card-title">{p.titles?.[locale] ?? p.title}</h3>

      <p className="card-price">
        <span className="price">{nzd.format(p.price)}</span>
        {p.wasPrice && p.wasPrice > p.price ? (
          <span className="was">
            {copy.results.was} <s>{nzd.format(p.wasPrice)}</s>
          </span>
        ) : null}
      </p>

      {rec.ranked === false ? null : (
        <div className="meter" data-band={band}>
          <div className="meter-track" role="img" aria-label={(p.fixture ? copy.results.meterLabel : copy.results.meterLabelLive)(Math.round(position))}>
            <span className="meter-mark" style={{ insetInlineStart: `${position}%` }} />
          </div>
          <p className="meter-caption">{copy.results.band[band]}</p>
        </div>
      )}

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
        <span className="visually-hidden">{copy.a11y.newWindow}</span>
      </a>
    </article>
  );
}
