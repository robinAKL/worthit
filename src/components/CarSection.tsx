import { useEffect, useMemo, useState } from 'react';
import { DICTIONARIES, type Copy, type Locale } from '../i18n';
import { allVehicles, carResults, type CarPick } from '../lib/cars';
import { vehiclesForQuery } from '../lib/cars/query';
import { carReason } from '../lib/cars/reason';
import type { Lane } from '../lib/types';
import { dealTier, savings } from '../lib/deal';
import { CardMedia, toneOf } from './CardMedia';
import { DealBadge, DealDelta, DealPanel, formatNzd } from './DealPanel';
import { LaneTabs } from './LaneTabs';
import type { AskContext } from './AskDialog';

const PANEL_ID = 'cars-panel';
/** Divisible by 4, 3, 2 and 1 columns, so the last row is never a lone card. */
const PAGE_SIZE = 12;

function formatDate(locale: Locale, iso?: string, withTime = false) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(DICTIONARIES[locale].language.intlLocale, {
    dateStyle: withTime ? 'medium' : 'long',
    ...(withTime ? { timeStyle: 'short' } : {}),
    timeZone: 'Pacific/Auckland',
  }).format(d);
}

interface Props {
  copy: Copy;
  locale: Locale;
  onAsk?: (context: AskContext) => void;
  query?: string;
}

export function CarSection({ copy, locale, query = '', onAsk }: Props) {
  const [lane, setLane] = useState<Lane>('value');
  const [shown, setShown] = useState(PAGE_SIZE);
  const fleet = useMemo(() => vehiclesForQuery(query, allVehicles()) ?? undefined, [query]);
  const result = useMemo(() => carResults(lane, fleet), [lane, fleet]);
  useEffect(() => setShown(PAGE_SIZE), [query]);
  const t = copy.cars;
  const visible = result.picks.slice(0, shown);
  const hidden = result.picks.length - visible.length;

  return (
    <section id="cars" className="cars" aria-labelledby="cars-title">
      <div className="wrap">
        <div className="results-head">
          <div>
            <h2 id="cars-title" className="section-title">
              {t.title}
            </h2>
            <p className="section-lede">{t.lede}</p>
          </div>
          <p className="notice" role="note">
            {t.notice(result.valued, result.dealers, formatDate(locale, result.capturedAt))}
          </p>
        </div>

        <LaneTabs
          copy={copy}
          lane={lane}
          labels={t.lanes}
          label={t.sort}
          idPrefix="car-lane"
          panelId={PANEL_ID}
          onChange={(l) => {
            setLane(l);
            setShown(PAGE_SIZE);
          }}
        />

        <div id={PANEL_ID} role="tabpanel" aria-labelledby={`car-lane-${lane}`} className="panel">
          <p className="panel-meta" aria-live="polite">
            {t.count(result.picks.length)}
          </p>
          {result.picks.length > 0 ? (
            <ul className="grid">
              {visible.map((pick) => (
                <li key={pick.car.id}>
                  <CarCard pick={pick} copy={copy} locale={locale} onAsk={onAsk} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{fleet ? t.emptyQuery : t.empty}</p>
          )}
          {hidden > 0 ? (
            <div className="more">
              <button type="button" className="more-button" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                {t.more(Math.min(hidden, PAGE_SIZE))}
              </button>
            </div>
          ) : null}
          <p className="cars-method">{t.method}</p>
        </div>
      </div>
    </section>
  );
}

function titleCase(text: string) {
  return text.replace(/(^|[\s/-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

function CarCard({ pick, copy, locale, onAsk }: { pick: CarPick; copy: Copy; locale: Locale; onAsk?: (context: AskContext) => void }) {
  const { car, valuation: v, cohort } = pick;
  const t = copy.cars;
  const d = copy.deal;
  const facts = [
    car.odometerKm !== undefined ? t.km(Math.round(car.odometerKm).toLocaleString('en-NZ')) : null,
    car.fuel ? t.fuel[car.fuel] : null,
    car.transmission ? t.transmission[car.transmission] : null,
    car.region ?? null,
  ].filter((f): f is string => Boolean(f));
  const caption = [car.model, car.body ? titleCase(car.body) : null, car.fuel ? t.fuel[car.fuel] : null].filter(Boolean).join(' · ');
  const title = `${car.year} ${car.make} ${car.model}`;

  const tier = dealTier(v.gap);
  const diff = savings(car.priceNzd, v.expected);
  const deltaText = tier === 'near' ? d.near('car') : diff > 0 ? d.under(formatNzd(diff), 'car') : d.over(formatNzd(-diff), 'car');
  const size = cohort.prices.length;
  const rankText =
    cohort.kind === 'model'
      ? d.rankModel(cohort.rank, size, cohort.label)
      : d.rankSegment(cohort.rank, size, d.body[cohort.label] ?? d.body.other, cohort.years?.[0] ?? car.year, cohort.years?.[1] ?? car.year);

  return (
    <article className="card car-card">
      <CardMedia
        src={car.imageUrl}
        mark={car.make}
        caption={caption}
        tone={toneOf(car.make)}
        badge={<DealBadge tier={tier} label={d.tier.car[tier]} />}
      />
      <p className="card-flag">{t.captured(formatDate(locale, car.capturedAt, true))}</p>
      <h3 className="card-title car-title" title={car.variant ? `${title} ${car.variant}` : title}>
        <span className="car-name">{title}</span>
        <span className="car-variant">{car.variant ?? ''}</span>
      </h3>

      <div className="card-price">
        <span className="price">{formatNzd(car.priceNzd)}</span>
        <DealDelta tier={tier} text={deltaText} />
      </div>

      <DealPanel
        rank={cohort.rank}
        placeMark={d.place(cohort.rank)}
        rankText={rankText}
        confidenceText={d.confidence.car(pick.confidence, v.groupSize, v.sample)}
      />

      <p className="card-reason">{carReason(pick, locale)}</p>

      <ul className="card-facts">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div className="card-actions">
        <a className="card-link" href={car.url} target="_blank" rel="noopener noreferrer nofollow">
          {t.viewAt(car.dealer)}
          <span className="visually-hidden">{copy.a11y.newWindow}</span>
        </a>
        {onAsk ? (
          <button type="button" className="card-ask" onClick={() => onAsk({ carId: car.id, title })} aria-label={copy.ask.aboutLabel(title)}>
            {copy.ask.about}
          </button>
        ) : null}
      </div>
    </article>
  );
}
