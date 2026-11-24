import { useMemo, useState } from 'react';
import type { Copy } from '../i18n';
import { checkSuburbRent, sa2Beds, sa2Dwellings, suburbChoices, type SuburbRentResult } from '../lib/rentSa2';
import type { Locale } from '../lib/types';

export function RentCheck({ copy, locale }: { copy: Copy['rent']; locale: Locale }) {
  const suburbs = useMemo(() => suburbChoices(), []);
  const dwellings = useMemo(() => sa2Dwellings(), []);
  const beds = useMemo(() => sa2Beds(), []);
  const [filter, setFilter] = useState('');
  const [code, setCode] = useState('253300');
  const [dwelling, setDwelling] = useState('House');
  const [bedCount, setBedCount] = useState('2');
  const [rent, setRent] = useState('');
  const matches = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query
      ? suburbs.filter((suburb) => `${suburb.name} ${suburb.ta} ${suburb.label}`.toLowerCase().includes(query))
      : suburbs;
  }, [suburbs, filter]);
  const selected = matches.some((suburb) => suburb.code === code) ? code : matches[0]?.code ?? '';
  const weekly = Number(rent);
  const result = rent.trim() !== '' && Number.isFinite(weekly) ? checkSuburbRent(selected, dwelling, bedCount, weekly) : null;
  const period = result && result.status !== 'unknown-suburb' && result.status !== 'invalid' ? quarterLabel(result.quarter, locale) : '';
  const dwellingLabel = label(copy.dwellings, dwelling);
  const bedLabel = label(copy.beds, bedCount);

  return (
    <section id="rent" className="rent" aria-labelledby="rent-title">
      <div className="wrap">
        <div className="rent-well">
          <h2 id="rent-title" className="section-title">{copy.title}</h2>
          <p className="section-lede">{copy.lede}</p>
          <form className="rent-form" onSubmit={(event) => event.preventDefault()}>
            <label className="rent-field">
              <span>{copy.suburbLabel}</span>
              <input
                value={filter}
                onChange={(event) => {
                  const next = event.target.value;
                  setFilter(next);
                  const query = next.trim().toLowerCase();
                  const nextMatches = query
                    ? suburbs.filter((suburb) => `${suburb.name} ${suburb.ta}`.toLowerCase().includes(query))
                    : suburbs;
                  if (nextMatches[0] && !nextMatches.some((suburb) => suburb.code === code)) setCode(nextMatches[0].code);
                }}
                placeholder={copy.suburbPlaceholder}
                aria-controls="rent-suburb"
                autoComplete="off"
              />
              <select
                id="rent-suburb"
                value={selected}
                onChange={(event) => setCode(event.target.value)}
              >
                {matches.map((suburb) => (
                  <option key={suburb.code} value={suburb.code}>{suburb.label}</option>
                ))}
              </select>
            </label>
            <label className="rent-field">
              <span>{copy.dwellingLabel}</span>
              <select value={dwelling} onChange={(event) => setDwelling(event.target.value)}>
                {dwellings.map((item) => (
                  <option key={item} value={item}>{label(copy.dwellings, item)}</option>
                ))}
              </select>
            </label>
            <label className="rent-field">
              <span>{copy.bedroomsLabel}</span>
              <select value={bedCount} onChange={(event) => setBedCount(event.target.value)}>
                {beds.map((item) => (
                  <option key={item} value={item}>{label(copy.beds, item)}</option>
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
            {result ? (
              <RentResult
                copy={copy}
                result={result}
                period={period}
                rent={weekly}
                dwellingLabel={dwellingLabel}
                bedLabel={bedLabel}
                locale={locale}
              />
            ) : <p>{copy.prompt}</p>}
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
            <a className="rent-link" href={copy.geographyHref} target="_blank" rel="noopener noreferrer">
              {copy.geography}
              <span className="visually-hidden">{copy.newWindow}</span>
            </a>
            <a className="rent-link" href={copy.geographyLicenceHref} target="_blank" rel="noopener noreferrer">
              {copy.geographyLicence}
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
  period,
  rent,
  dwellingLabel,
  bedLabel,
  locale,
}: {
  copy: Copy['rent'];
  result: SuburbRentResult;
  period: string;
  rent: number;
  dwellingLabel: string;
  bedLabel: string;
  locale: Locale;
}) {
  if (result.status === 'band') {
    return <p>{copy.suburbBands[result.band](result.suburb, result.ta, period, dwellingLabel, bedLabel, Math.round(rent), result.lower, result.median, result.upper, result.count)}</p>;
  }
  if (result.status === 'insufficient') {
    const fallback = result.fallback;
    return (
      <>
        <p>{copy.suburbInsufficient}</p>
        {fallback.status === 'band' ? (
          <p>
            {copy.fallbackLead}{' '}
            {copy.bands[fallback.band](fallback.area, monthLabel(fallback.month, locale), Math.round(rent), fallback.lower, fallback.median, fallback.upper, fallback.count)}
          </p>
        ) : <p>{copy.fallbackMissing}</p>}
      </>
    );
  }
  if (result.status === 'unknown-suburb') return <p>{copy.unknownSuburb}</p>;
  return <p>{copy.prompt}</p>;
}

function label(table: object, key: string): string {
  const value = (table as Record<string, string>)[key];
  return value ?? key;
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

function quarterLabel(quarter: string, locale: Locale): string {
  const date = new Date(`${quarter}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return quarter;
  const day = new Intl.DateTimeFormat(locale === 'zh-Hans' ? 'zh-Hans' : 'en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(date);
  return locale === 'zh-Hans' ? `${day}起的季度` : `quarter starting ${day}`;
}
