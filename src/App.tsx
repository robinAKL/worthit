import { useDeferredValue, useMemo, useState, type FormEvent } from 'react';
import { search } from './lib/search';
import type { Lane, Recommendation } from './lib/types';
import { DICTIONARIES, useLocale, type Locale } from './i18n';
import { LanguageSelect } from './components/LanguageSelect';
import { LaneTabs } from './components/LaneTabs';
import { ProductCard } from './components/ProductCard';
import { RentCheck } from './components/RentCheck';

const PANEL_ID = 'results-panel';
const PAGE_SIZE = 8;

function formatDate(locale: Locale, iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(DICTIONARIES[locale].language.intlLocale, { dateStyle: 'long', timeZone: 'Pacific/Auckland' }).format(d);
}

/** Price position (0 to 100) of each item within its own category in this result set. */
function positions(items: Recommendation[]) {
  const range = new Map<string, { min: number; max: number }>();
  for (const { product: p } of items) {
    const r = range.get(p.category) ?? { min: p.price, max: p.price };
    range.set(p.category, { min: Math.min(r.min, p.price), max: Math.max(r.max, p.price) });
  }
  return items.map(({ product: p }) => {
    const r = range.get(p.category)!;
    return r.max === r.min ? 50 : ((p.price - r.min) / (r.max - r.min)) * 100;
  });
}

export default function App() {
  const { locale, copy, changeLocale } = useLocale();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<Lane>('value');
  const [expanded, setExpanded] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const result = useMemo(() => search(deferredQuery, lane, locale), [deferredQuery, lane, locale]);
  const pos = useMemo(() => positions(result.items), [result.items]);
  const visible = expanded ? result.items : result.items.slice(0, PAGE_SIZE);
  const hidden = result.items.length - visible.length;
  const captured = formatDate(locale, result.items[0]?.product.capturedAt);

  function submit(e: FormEvent) {
    e.preventDefault();
    setQuery(draft.trim());
    setExpanded(false);
    document.getElementById('results')?.scrollIntoView({ block: 'start' });
  }

  function pickExample(text: string) {
    setDraft(text);
    setQuery(text);
    setExpanded(false);
  }

  return (
    <>
      <a className="skip" href="#results">
        {copy.a11y.skip}
      </a>

      <header className="nav">
        <div className="wrap nav-inner">
          <a className="wordmark" href="#top" aria-label={copy.a11y.home}>
            {copy.brand}
            {copy.brandLocal ? <span className="wordmark-local">{copy.brandLocal}</span> : null}
          </a>
          <nav aria-label={copy.a11y.navigation}>
            <ul className="nav-links">
              {copy.nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSelect locale={locale} label={copy.a11y.language} onChange={changeLocale} />
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero-inner">
            <h1 id="hero-title" className="hero-title">
              {copy.hero.title}
            </h1>
            <p className="hero-lede">{copy.hero.lede}</p>

            <form className="ask" role="search" onSubmit={submit}>
              <label className="visually-hidden" htmlFor="ask-input">
                {copy.hero.inputLabel}
              </label>
              <input
                id="ask-input"
                className="ask-input"
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder={copy.hero.placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="ask-submit" type="submit">
                {copy.hero.submit}
              </button>
            </form>

            <div className="examples">
              <p className="examples-label">{copy.hero.examplesLabel}</p>
              <ul className="examples-list">
                {copy.hero.examples.map((ex) => (
                  <li key={ex}>
                    <button type="button" className="chip" onClick={() => pickExample(ex)}>
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="results" className="results" aria-labelledby="results-title">
          <div className="wrap">
            <div className="results-head">
              <div className="results-heading">
                <h2 id="results-title" className="section-title">
                  {query ? copy.results.titleQuery(query) : copy.results.titleDefault}
                </h2>
                {query ? (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setDraft('');
                      setQuery('');
                    }}
                  >
                    {copy.results.clear}
                  </button>
                ) : null}
              </div>
              <p className="notice" role="note">
                <strong>{copy.results.notice}</strong> {captured ? copy.results.capturedOn(captured) : null}
              </p>
            </div>

            <LaneTabs
              copy={copy}
              lane={lane}
              onChange={(l) => {
                setLane(l);
                setExpanded(false);
              }}
              panelId={PANEL_ID}
            />

            <div id={PANEL_ID} role="tabpanel" aria-labelledby={`lane-${lane}`} className="panel">
              <p className="panel-meta" aria-live="polite">
                {copy.results.count(result.items.length)}
                {result.excludedCount > 0 ? <span> {copy.results.excluded(result.excludedCount)}</span> : null}
              </p>

              {result.items.length > 0 ? (
                <ul className="grid">
                  {visible.map((rec, i) => (
                    <li key={rec.product.id}>
                      <ProductCard rec={rec} position={pos[i]} locale={locale} copy={copy} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">{copy.results.empty}</p>
              )}

              {hidden > 0 ? (
                <div className="more">
                  <button type="button" className="more-button" onClick={() => setExpanded(true)}>
                    {copy.results.more(hidden)}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="rank" className="rank" aria-labelledby="rank-title">
          <div className="wrap split">
            <div className="split-head">
              <h2 id="rank-title" className="section-title">
                {copy.rank.title}
              </h2>
              <p className="section-lede">{copy.rank.lede}</p>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {copy.rank.head.map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {copy.rank.rows.map((r) => (
                    <tr key={r.lane}>
                      <th scope="row">{copy.lanes[r.lane].label}</th>
                      <td>{r.how}</td>
                      <td>{r.never}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <RentCheck copy={copy.rent} locale={locale} />

        <section id="data" className="data" aria-labelledby="data-title">
          <div className="wrap split">
            <div className="split-head">
              <h2 id="data-title" className="section-title">
                {copy.data.title}
              </h2>
              <p className="section-lede">{copy.data.lede}</p>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {copy.data.head.map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {copy.data.rows.map(([source, status, note]) => (
                    <tr key={source}>
                      <th scope="row">{source}</th>
                      <td>
                        <span className="status">{status}</span>
                      </td>
                      <td>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <p>{copy.footer}</p>
        </div>
      </footer>
    </>
  );
}
