import { useMemo, useState } from 'react';
import { DICTIONARIES, type Copy, type Locale } from '../i18n';
import { carResults, type CarPick } from '../lib/cars';
import { carReason } from '../lib/cars/reason';
import type { Lane } from '../lib/types';
import { LaneTabs } from './LaneTabs';

const PANEL_ID = 'cars-panel';
const PAGE_SIZE = 6;
const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 });

function formatDate(locale: Locale, iso?: string, withTime = false) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(DICTIONARIES[locale].language.intlLocale, {
    dateStyle: 'long',
    ...(withTime ? { timeStyle: 'short' } : {}),
    timeZone: 'Pacific/Auckland',
  }).format(d);
}

interface Props {
  copy: Copy;
  locale: Locale;
}

export function CarSection({ copy, locale }: Props) {
  const [lane, setLane] = useState<Lane>('value');
  const [expanded, setExpanded] = useState(false);
  const result = useMemo(() => carResults(lane), [lane]);
  const t = copy.cars;
  const visible = expanded ? result.picks : result.picks.slice(0, PAGE_SIZE);
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
            setExpanded(false);
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
                  <CarCard pick={pick} copy={copy} locale={locale} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{t.empty}</p>
          )}
          {hidden > 0 ? (
            <div className="more">
              <button type="button" className="more-button" onClick={() => setExpanded(true)}>
                {t.more(hidden)}
              </button>
            </div>
          ) : null}
          <p className="cars-method">{t.method}</p>
        </div>
      </div>
    </section>
  );
}

function CarCard({ pick, copy, locale }: { pick: CarPick; copy: Copy; locale: Locale }) {
  const { car } = pick;
  const t = copy.cars;
  const facts = [
    car.odometerKm !== undefined ? t.km(Math.round(car.odometerKm).toLocaleString('en-NZ')) : null,
    car.fuel ? t.fuel[car.fuel] : null,
    car.transmission ? t.transmission[car.transmission] : null,
    car.region ?? null,
  ].filter((f): f is string => Boolean(f));
  const initials = `${car.make[0] ?? ''}${car.model[0] ?? ''}`.toUpperCase();

  return (
    <article className="card car-card">
      <div className="car-head">
        <span className="car-mark" aria-hidden="true">
          {initials}
        </span>
        <div>
          <h3 className="card-title">
            {car.year} {car.make} {car.model}
          </h3>
          {car.variant ? <p className="car-variant">{car.variant}</p> : null}
        </div>
      </div>

      <p className="card-price">
        <span className="price">{nzd.format(car.priceNzd)}</span>
      </p>

      <p className="card-reason">{carReason(pick, locale)}</p>

      <ul className="card-facts">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <p className="card-flag">{t.captured(formatDate(locale, car.capturedAt, true))}</p>

      <a className="card-link" href={car.url} target="_blank" rel="noopener noreferrer nofollow">
        {t.viewAt(car.dealer)}
        <span className="visually-hidden">{copy.a11y.newWindow}</span>
      </a>
    </article>
  );
}
