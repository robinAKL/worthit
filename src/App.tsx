import { useDeferredValue, useMemo, useState, type FormEvent } from 'react';
import { comparisonKey, search } from './lib/search';
import type { Lane, Recommendation } from './lib/types';
import { priceRankIn, type Cohort } from './lib/deal';
import { isComparableGroup } from './lib/cohort';
import { isUnitComparable, peersFor } from './lib/specCompare';
import { unitPrice } from './lib/specs';
import { DICTIONARIES, useLocale, type Locale } from './i18n';
import { LanguageSelect } from './components/LanguageSelect';
import { LaneTabs } from './components/LaneTabs';
import { ProductCard } from './components/ProductCard';
import { RentCheck } from './components/RentCheck';
import { CarSection } from './components/CarSection';
import { AskDialog, type AskContext } from './components/AskDialog';
import { allVehicles } from './lib/cars';
import { querySelectsCars } from './lib/cars/query';

const PANEL_ID = 'results-panel';
/** Divisible by 4, 3, 2 and 1 columns, so the last row is never a lone card. */
const PAGE_SIZE = 12;
type ResultView = 'products' | 'cars' | 'all';

function formatDate(locale: Locale, iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(DICTIONARIES[locale].language.intlLocale, { dateStyle: 'long', timeZone: 'Pacific/Auckland' }).format(d);
}

/** Each item's comparable prices: the same set the reason's median came from. */
function cohorts(items: Recommendation[]): Cohort[] {
  // Sized families (fridges, washers...) compare price per unit; everything else compares price.
  const valueOf = (p: Recommendation['product']) => (isUnitComparable(p) ? unitPrice(p.price, p.spec)! : p.price);
  const groups = new Map<string, Recommendation['product'][]>();
  for (const { product: p, cohortPrices } of items) {
    if (cohortPrices) continue;
    const key = comparisonKey(p);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return items.map((item) => {
    const p = item.product;
    const value = valueOf(p);
    let prices = item.cohortPrices;
    let band = item.cohortBand;
    if (!prices) {
      const group = groups.get(comparisonKey(p)) ?? [p];
      const peers = isUnitComparable(p) ? peersFor(p, group) : { peers: group, band: undefined };
      prices = peers.peers.map(valueOf).sort((x, y) => x - y);
      band = peers.band;
    }
    const base: Cohort = { kind: 'group', label: p.category, prices, rank: priceRankIn(prices, value) };
    return isUnitComparable(p) ? { ...base, unit: p.spec.unit, size: p.spec.size, family: p.spec.family, band } : base;
  });
}

export default function App() {
  const { locale, copy, changeLocale } = useLocale();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<Lane>('value');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [ask, setAsk] = useState<AskContext | null>(null);
  const [view, setView] = useState<ResultView>('products');
  const deferredQuery = useDeferredValue(query);

  const result = useMemo(() => search(deferredQuery, lane, locale), [deferredQuery, lane, locale]);
  const groups = useMemo(() => cohorts(result.items), [result.items]);
  // A group we can actually rank comes before a mixed one, so the first screen is not all "no price call".
  const ordered = useMemo(
    () =>
      result.items
        .map((rec, i) => ({ rec, cohort: groups[i] }))
        .sort((a, b) => Number(isComparableGroup(b.cohort.prices)) - Number(isComparableGroup(a.cohort.prices))),
    [result.items, groups],
  );
  const visible = ordered.slice(0, shown);
  const hidden = ordered.length - visible.length;
  const captured = formatDate(locale, result.items[0]?.product.capturedAt);

  function reveal(text: string) {
    setView(querySelectsCars(text, allVehicles()) ? 'cars' : 'products');
    document.getElementById('results')?.scrollIntoView({ block: 'start' });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    setQuery(text);
    setShown(PAGE_SIZE);
    reveal(text);
  }

  function pickExample(text: string) {
    setDraft(text);
    setQuery(text);
    setShown(PAGE_SIZE);
    reveal(text);
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
                    {n.href === '#cars' ? (
                      <a
                        href="#results"
                        onClick={(e) => {
                          e.preventDefault();
                          setView('cars');
                          document.getElementById('results')?.scrollIntoView({ block: 'start' });
                        }}
                      >
                        {n.label}
                      </a>
                    ) : (
                      <a href={n.href}>{n.label}</a>
                    )}
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
            <button type="button" className="hero-ask" onClick={() => setAsk({})}>
              {copy.ask.open}
            </button>
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
                      setView('products');
                    }}
                  >
                    {copy.results.clear}
                  </button>
                ) : null}
              </div>
              <p className="notice" role="note">
                {result.fixture ? (
                  <>
                    <strong>{copy.results.notice}</strong> {captured ? copy.results.capturedOn(captured) : null}
                  </>
                ) : (
                  <strong>{copy.results.feedNotice}</strong>
                )}
              </p>
            </div>

            <div className="scope" role="group" aria-label={copy.results.scopeLabel}>
              {(['products', 'cars', 'all'] as const).map((id) => (
                <button key={id} type="button" className="scope-button" aria-pressed={view === id} onClick={() => setView(id)}>
                  {copy.results.scope[id]}
                </button>
              ))}
            </div>

            {view !== 'products' ? <CarSection copy={copy} locale={locale} query={query} onAsk={setAsk} /> : null}

            {view !== 'cars' ? (
            <>
            <LaneTabs
              copy={copy}
              lane={lane}
              onChange={(l) => {
                setLane(l);
                setShown(PAGE_SIZE);
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
                  {visible.map(({ rec, cohort }) => (
                    <li key={rec.product.id}>
                      <ProductCard rec={rec} cohort={cohort} locale={locale} copy={copy} onAsk={setAsk} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">
                  <p>{result.query.kind === 'car' ? copy.results.emptyCars : copy.results.empty}</p>
                  {result.query.kind === 'car' ? (
                    <button type="button" className="text-button" onClick={() => setView('cars')}>
                      {copy.results.showCars}
                    </button>
                  ) : (
                    <ul className="examples-list">
                      {copy.hero.examples.map((ex) => (
                        <li key={ex}>
                          <button type="button" className="chip" onClick={() => pickExample(ex)}>
                            {ex}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {hidden > 0 ? (
                <div className="more">
                  <button type="button" className="more-button" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                    {copy.results.more(Math.min(hidden, PAGE_SIZE))}
                  </button>
                </div>
              ) : null}
            </div>
            </>
            ) : null}
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

      <AskDialog context={ask} onClose={() => setAsk(null)} copy={copy} locale={locale} />

      <footer className="footer">
        <div className="wrap">
          <p>{copy.footer}</p>
        </div>
      </footer>
    </>
  );
}
