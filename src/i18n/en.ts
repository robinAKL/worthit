import type { Lane } from '../lib/types';

/** English is the reference schema; translations must implement every key. */
export const en = {
  language: { name: 'English', intlLocale: 'en-NZ' },
  brand: 'WorthIt',
  brandLocal: '',
  meta: {
    title: 'WorthIt: Find what is worth buying',
    description: 'Compare sample products by value, price or quality, with a clear reason for every recommendation. Made for shoppers in New Zealand.',
  },
  a11y: {
    skip: 'Skip to recommendations', home: 'WorthIt home', navigation: 'Page navigation',
    language: 'Choose language', sort: 'Sort recommendations', newWindow: ' (opens in a new tab)',
  },
  nav: [
    { href: '#rank', label: 'How we compare' },
    { href: '#rent', label: 'Rent check' },
    { href: '#data', label: 'Our sources' },
  ],
  hero: {
    title: 'Find what is worth buying',
    lede: 'Tell us what you need. Compare price, quality and the trade-offs.',
    inputLabel: 'What are you looking for?',
    placeholder: 'Try: a laptop under $1,500',
    submit: 'Compare',
    examplesLabel: 'Try a search',
    examples: ['Laptop under $1,500', 'Phone for my mum', 'Desk for a small flat'],
  },
  results: {
    titleDefault: 'Start with these picks',
    titleQuery: (q: string) => `Results for “${q}”`,
    notice: 'Sample data. Prices are not live.',
    capturedOn: (date: string) => `Sample dated ${date}.`,
    count: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
    excluded: (n: number) => `${n} ${n === 1 ? 'item was' : 'items were'} left out for missing photos or key details.`,
    empty: 'No sample products match. Try a higher budget or a different description.',
    clear: 'Clear search',
    more: (n: number) => `Show ${n} more`,
    viewAt: (merchant: string) => `View at ${merchant}`,
    was: 'Was',
    band: { low: 'Lower price range', mid: 'Middle price range', high: 'Higher price range' },
    condition: { new: 'New', refurbished: 'Refurbished', used: 'Used' },
    warranty: (m: number) => `${m}-month warranty`,
    rating: (r: number, n?: number) => n ? `Rated ${r.toFixed(1)} (${n} ${n === 1 ? 'review' : 'reviews'})` : `Rated ${r.toFixed(1)}`,
    meterLabel: (pos: number) => `${pos}% of the way from the lower to the upper price in this sample category`,
  },
  lanes: {
    value: { label: 'Value', hint: 'A balance of price and quality' },
    cheap: { label: 'Lower price', hint: 'Lower prices with key details checked' },
    refined: { label: 'Quality', hint: 'Reviews, condition and warranty come first' },
  },
  rank: {
    title: 'How we compare',
    lede: 'We compare products within the same category. Every pick includes a reason you can check against its details.',
    head: ['Lane', 'What we consider', 'What we do not promise'],
    rows: [
      { lane: 'value' as Lane, how: 'Price within the category, review count and photo count, with key specifications required.', never: 'One choice that suits everyone.' },
      { lane: 'cheap' as Lane, how: 'Prices near the lower quarter of the category, with photos and key specifications.', never: 'The lowest price across every shop.' },
      { lane: 'refined' as Lane, how: 'Review count, photos, clear condition details and warranty. Prices may be above the middle of the range.', never: 'Luxury certification or investment value.' },
    ],
  },
  rent: {
    title: 'Is your rent in range?',
    lede: 'Coming next: enter an area, bedroom count and weekly rent to compare with public rental bond records.',
    note: 'Source: MBIE rental bond data, licensed under CC BY 3.0 NZ. Records reflect rent when a tenancy starts, rather than current advertised rent. Publication is about two months behind.',
    link: 'View the rental bond data',
    href: 'https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/',
  },
  data: {
    title: 'Our sources',
    lede: 'Products will come from merchants who share their data or permit us to use it. Follow a product link to buy on the merchant’s website.',
    head: ['Source', 'Status', 'Details'],
    rows: [
      ['Sample products', 'In use', 'Products, merchants and prices on this page are fictional examples of how ranking works.'],
      ['Merchant product data', 'Planned', 'Merchants provide product data. We show its date and link to their website.'],
      ['Public rental data', 'Coming next', 'MBIE rental bond records, CC BY 3.0 NZ, with attribution to MBIE.'],
      ['Sites that restrict collection', 'Excluded', 'We do not collect data where site terms or robots.txt prohibit it.'],
    ],
  },
  footer: 'WorthIt 2026. This is a demo. Products and prices are sample data.',
};

export type Copy = typeof en;
