import { DICTIONARIES, type Copy, type Locale } from '../i18n';
import { countsAsSpec, unrankedReason } from '../lib/score';
import type { Recommendation } from '../lib/types';
import { confidenceFrom, dealTier, median, savings, type Cohort } from '../lib/deal';
import { CardMedia, toneOf } from './CardMedia';
import { historySentence } from '../lib/historyView';
import { DealBadge, DealDelta, DealPanel } from './DealPanel';
import { bandLabel, familyName, sizeLabel, UNIT_NAME } from '../lib/specCompare';

/** Above this p90/p10 price ratio a group is too mixed to call one price typical. */
const MAX_SPREAD = 3;
const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 });

function formatCaptured(locale: Locale, iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DICTIONARIES[locale].language.intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(date);
}

interface Props {
  copy: Copy;
  locale: Locale;
  rec: Recommendation;
  /** Comparable prices in this item's group, with its rank. */
  cohort: Cohort;
}

export function ProductCard({ rec, cohort, copy, locale }: Props) {
  const { product: p, reason } = rec;
  const d = copy.deal;
  const size = cohort.prices.length;
  // Fewer than 3 comparable prices is not a comparison. A group whose prices spread more than 3x
  // (say a bar fridge next to a 600 L fridge) mixes different products; we show the strip but make no claim.
  const p10 = cohort.prices[Math.floor((size - 1) * 0.1)] ?? 0;
  const p90 = cohort.prices[Math.ceil((size - 1) * 0.9)] ?? 0;
  const mixed = size >= 3 && p10 > 0 && p90 / p10 > MAX_SPREAD;
  const comparable = size >= 3 && !mixed;
  const typical = median(cohort.prices);
  // Sized families (fridges per litre, washers per kg) compare price per unit, then show the
  // difference in dollars for this item's own size.
  const perUnit = cohort.unit && cohort.size ? { unit: cohort.unit, size: cohort.size } : null;
  const own = perUnit ? p.price / perUnit.size : p.price;
  const tier = dealTier(own / typical - 1);
  const diff = savings(p.price, perUnit ? typical * perUnit.size : typical);
  const sizeText = perUnit ? sizeLabel(perUnit.size, perUnit.unit, locale) : '';
  const deltaText = perUnit
    ? tier === 'near'
      ? d.nearForSize(sizeText)
      : diff > 0
        ? d.underForSize(nzd.format(diff), sizeText)
        : d.overForSize(nzd.format(-diff), sizeText)
    : tier === 'near'
      ? d.near('product')
      : diff > 0
        ? d.under(nzd.format(diff), 'product')
        : d.over(nzd.format(-diff), 'product');
  const unitShort = perUnit ? (perUnit.unit === 'place' ? 'set' : perUnit.unit) : '';
  const format = perUnit ? (n: number) => `$${n.toFixed(n < 100 ? 2 : 0)}/${unitShort}` : (n: number) => nzd.format(n);
  const confidence = mixed ? 1 : confidenceFrom(size);
  const specs = Object.entries(p.specs)
    .map(([key, value]) => [key, p.localizedSpecs?.[locale]?.[key] ?? value] as const)
    .filter(([key, value]) => countsAsSpec(p, key, value) && String(value).length <= 14)
    .slice(0, 3);

  const captured = formatCaptured(locale, p.capturedAt);
  const history = historySentence(p, copy.results.history, (n) => nzd.format(n));

  return (
    <article className="card">
      <CardMedia
        src={p.imageUrl}
        mark={String(p.specs.brand ?? p.category.replace(/-/g, ' '))}
        caption={
          p.spec?.size && p.spec.unit
            ? [p.spec.style?.replace(/-/g, ' '), sizeLabel(p.spec.size, p.spec.unit, locale)].filter(Boolean).join(' · ')
            : p.category.replace(/-/g, ' ')
        }
        tone={toneOf(p.category)}
        badge={comparable ? <DealBadge tier={tier} label={d.tier.product[tier]} /> : undefined}
      />
      <p className="card-flag">{p.fixture ? copy.results.sampleFlag : copy.results.capturedPrice(captured)}</p>
      <h3 className="card-title" title={p.titles?.[locale] ?? p.title}>
        {p.titles?.[locale] ?? p.title}
      </h3>

      <div className="card-price">
        <span className="price">{nzd.format(p.price)}</span>
        {comparable ? <DealDelta tier={tier} text={deltaText} /> : null}
        {p.wasPrice && p.wasPrice > p.price ? (
          <span className="was">
            {copy.results.was} <s>{nzd.format(p.wasPrice)}</s>
          </span>
        ) : null}
      </div>
      {history ? <p className="card-history">{history}</p> : null}

      {comparable || mixed ? (
        <DealPanel
          cohort={cohort}
          price={own}
          reference={typical}
          referenceLabel={`${d.typicalMark} ${format(typical)}`}
          format={format}
          rankText={
            mixed
              ? d.mixed(format(cohort.prices[0]), format(cohort.prices[size - 1]))
              : perUnit
                ? d.rankUnit(
                    cohort.rank,
                    size,
                    cohort.band
                      ? `${familyName(cohort.family ?? '', locale)} (${bandLabel(cohort.band, locale)})`
                      : familyName(cohort.family ?? '', locale),
                    UNIT_NAME[locale][perUnit.unit],
                  )
                : d.rankGroup(cohort.rank, size)
          }
          stripLabel={d.strip(cohort.rank, size)}
          confidence={confidence}
          confidenceText={mixed ? d.mixedNote : d.confidence.product(confidence, size)}
          confidenceLabel={d.confidence.label(confidence)}
        />
      ) : (
        <div className="deal-panel deal-panel-empty">
          <p className="deal-rank">{d.notEnough(size)}</p>
        </div>
      )}

      <p className="card-reason">{mixed ? unrankedReason(p, locale) : reason}</p>

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
