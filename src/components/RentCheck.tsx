import { useMemo, useState } from 'react';
import type { Copy } from '../i18n';
import { checkRent, rentAreaNames, type BedroomCount, type RentCheckResult } from '../lib/rent';
import type { Locale } from '../lib/types';

const BEDROOMS: BedroomCount[] = ['all', 1, 2, 3, 4, '5+'];

export function RentCheck({ copy, locale }: { copy: Copy['rent']; locale: Locale }) {
  const areas = useMemo(() => rentAreaNames(), []);
  const [filter, setFilter] = useState('');
  const [area, setArea] = useState('New Zealand');
  const [bedrooms, setBedrooms] = useState<BedroomCount>('all');
  const [rent, setRent] = useState('');
  const matches = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query ? areas.filter((name) => name.toLowerCase().includes(query)) : areas;
  }, [areas, filter]);
  const weekly = Number(rent);
  const result = rent.trim() !== '' && Number.isFinite(weekly) ? checkRent(area, bedrooms, weekly) : null;
  const month = result ? monthLabel(result.month, locale) : '';

  return (
    <section id="rent" className="rent" aria-labelledby="rent-title">
      <div className="wrap">
        <div className="rent-well">
          <h2 id="rent-title" className="section-title">{copy.title}</h2>
          <p className="section-lede">{copy.lede}</p>
          <form className="rent-form" onSubmit={(event) => event.preventDefault()}>
            <label className="rent-field">
              <span>{copy.areaLabel}</span>
              <input
                value={filter}
                onChange={(event) => {
                  const next = event.target.value;
                  setFilter(next);
                  const query = next.trim().toLowerCase();
                  const nextMatches = query ? areas.filter((name) => name.toLowerCase().includes(query)) : areas;
                  if (nextMatches[0] && !nextMatches.includes(area)) setArea(nextMatches[0]);
                }}
                placeholder={copy.areaPlaceholder}
                aria-controls="rent-area"
                autoComplete="off"
              />
              <select
                id="rent-area"
                value={matches.includes(area) ? area : matches[0] ?? ''}
                onChange={(event) => setArea(event.target.value)}
              >
                {matches.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="rent-field">
              <span>{copy.bedroomsLabel}</span>
              <select
                value={String(bedrooms)}
                onChange={(event) => setBedrooms(parseBedrooms(event.target.value))}
              >
                {BEDROOMS.map((count) => (
                  <option key={String(count)} value={String(count)}>{copy.bedrooms[count]}</option>
                ))}
              </select>
            </label>
            <label className="rent-field">
              <span>{copy.rentLabel}</span>
              <input
                inputMode="decimal"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
                placeholder={copy.rentPlaceholder}
              />
            </label>
          </form>
          <div className="rent-result" aria-live="polite">
            {result ? <RentResult copy={copy} result={result} month={month} rent={weekly} /> : <p>{copy.prompt}</p>}
            {result?.oneBedroomCaution ? <p className="rent-caution">{copy.oneBedroom}</p> : null}
          </div>
          <p className="rent-note">{copy.note}</p>
          <p className="rent-links">
            <a className="rent-link" href={copy.href} target="_blank" rel="noopener noreferrer">
              {copy.link}
              <span className="visually-hidden">{copy.newWindow}</span>
            </a>
            <a className="rent-link" href={copy.licenceHref} target="_blank" rel="noopener noreferrer">
              {copy.licence}
              <span className="visually-hidden">{copy.newWindow}</span>
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function RentResult({
  copy,
  result,
  month,
  rent,
}: {
  copy: Copy['rent'];
  result: RentCheckResult;
  month: string;
  rent: number;
}) {
  if (result.status === 'band') {
    return <p>{copy.bands[result.band](result.area, month, Math.round(rent), result.lower, result.median, result.upper, result.count)}</p>;
  }
  if (result.status === 'insufficient') return <p>{copy.insufficient}</p>;
  if (result.status === 'unsplit') return <p>{copy.unsplit}</p>;
  if (result.status === 'unknown-area') return <p>{copy.unknownArea}</p>;
  return <p>{copy.prompt}</p>;
}

function parseBedrooms(value: string): BedroomCount {
  if (value === 'all' || value === '5+') return value;
  const count = Number(value);
  if (count === 1 || count === 2 || count === 3 || count === 4) return count;
  return 'all';
}

function monthLabel(month: string, locale: Locale): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat(locale === 'zh-Hans' ? 'zh-Hans' : 'en-NZ', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(date);
}
