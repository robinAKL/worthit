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
    lede: 'Choose a suburb, a dwelling type and a bedroom count. We compare your weekly rent with that single published row.',
    note: 'A suburb figure counts new bonds lodged in that quarter for one statistical area, one dwelling type and one bedroom count. It is not an advertised rent. When that cell is too small to publish, the fallback is the territorial-authority figure for all bedrooms, which is also newly lodged bonds and is not split by bedroom. Publication lags. Sources: MBIE, CC BY 3.0 NZ, and Stats NZ Statistical Area 2 2019 names, CC BY 4.0.',
    link: 'View the rental bond data',
    href: 'https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/',
    licence: 'CC BY 3.0 NZ',
    licenceHref: 'https://creativecommons.org/licenses/by/3.0/nz/',
    geography: 'Stats NZ SA2 2019 names',
    geographyHref: 'https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/',
    geographyLicence: 'CC BY 4.0',
    geographyLicenceHref: 'https://creativecommons.org/licenses/by/4.0/',
    newWindow: ' (opens in a new tab)',
    areaLabel: 'Area',
    areaPlaceholder: 'Search areas',
    suburbLabel: 'Suburb',
    suburbPlaceholder: 'Search suburbs',
    dwellingLabel: 'Dwelling type',
    dwellings: {
      ALL: 'All dwelling types',
      House: 'House',
      Flat: 'Flat',
      Apartment: 'Apartment',
      Room: 'Room',
      'Boarding House': 'Boarding house',
    },
    beds: {
      ALL: 'All',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '5+': '5 or more',
      '6': '6',
      NA: 'Not recorded',
    },
    bedroomsLabel: 'Bedrooms',
    bedrooms: {
      all: 'All',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      '5+': '5 or more',
    },
    rentLabel: 'Weekly rent (NZD)',
    rentPlaceholder: '650',
    prompt: 'Enter a weekly rent to see where it sits.',
    insufficient: 'Not enough bonds were recorded to show a range.',
    suburbInsufficient: 'Not enough bonds were published for this suburb, dwelling type and bedroom count.',
    fallbackLead: 'Territorial authority, all bedrooms:',
    fallbackMissing: 'The territorial-authority file has no matching area for this fallback.',
    unsplit: 'This monthly file is not split by bedroom. Choose all bedrooms to see the range for the area.',
    unknownArea: 'Choose an area from the list.',
    unknownSuburb: 'Choose a suburb from the list.',
    oneBedroom: 'Tenancy Services says one-bedroom figures can be inaccurate, because some bonds are recorded as one bedroom when the home has more.',
    bands: {
      below: (area: string, month: string, rent: number, lower: number, _median: number, _upper: number, count: number) =>
        `$${rent} a week is under the lower quartile of $${lower} for ${count.toLocaleString('en-NZ')} new bonds in ${area} (${month}).`,
      'lower-to-median': (area: string, month: string, rent: number, lower: number, median: number, _upper: number, count: number) =>
        `$${rent} a week sits from the lower quartile ($${lower}) to the median ($${median}) of ${count.toLocaleString('en-NZ')} new bonds in ${area} (${month}).`,
      'median-to-upper': (area: string, month: string, rent: number, _lower: number, median: number, upper: number, count: number) =>
        `$${rent} a week sits from the median ($${median}) to the upper quartile ($${upper}) of ${count.toLocaleString('en-NZ')} new bonds in ${area} (${month}).`,
      above: (area: string, month: string, rent: number, _lower: number, _median: number, upper: number, count: number) =>
        `$${rent} a week is above the upper quartile of $${upper} for ${count.toLocaleString('en-NZ')} new bonds in ${area} (${month}).`,
    },
    suburbBands: {
      below: (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, lower: number, _median: number, _upper: number, count: number) =>
        `$${rent} a week is under the lower quartile of $${lower} for ${count.toLocaleString('en-NZ')} new bonds lodged in the quarter in ${suburb}, ${ta} (${period}, ${dwelling}, ${beds}).`,
      'lower-to-median': (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, lower: number, median: number, _upper: number, count: number) =>
        `$${rent} a week sits from the lower quartile ($${lower}) to the median ($${median}) of ${count.toLocaleString('en-NZ')} new bonds lodged in the quarter in ${suburb}, ${ta} (${period}, ${dwelling}, ${beds}).`,
      'median-to-upper': (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, _lower: number, median: number, upper: number, count: number) =>
        `$${rent} a week sits from the median ($${median}) to the upper quartile ($${upper}) of ${count.toLocaleString('en-NZ')} new bonds lodged in the quarter in ${suburb}, ${ta} (${period}, ${dwelling}, ${beds}).`,
      above: (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, _lower: number, _median: number, upper: number, count: number) =>
        `$${rent} a week is above the upper quartile of $${upper} for ${count.toLocaleString('en-NZ')} new bonds lodged in the quarter in ${suburb}, ${ta} (${period}, ${dwelling}, ${beds}).`,
    },
  },
  data: {
    title: 'Our sources',
    lede: 'Products will come from merchants who share their data or permit us to use it. Follow a product link to buy on the merchant’s website.',
    head: ['Source', 'Status', 'Details'],
    rows: [
      ['Sample products', 'In use', 'Products, merchants and prices on this page are fictional examples of how ranking works.'],
      ['Merchant product data', 'Planned', 'Merchants provide product data. We show its date and link to their website.'],
      ['Public rental data', 'In use', 'MBIE bonds lodged by suburb for the quarter starting 1 July 2026, plus September 2026 territorial figures. CC BY 3.0 NZ, attribute MBIE. Suburb names: Stats NZ SA2 2019, CC BY 4.0.'],
      ['Sites that restrict collection', 'Excluded', 'We do not collect data where site terms or robots.txt prohibit it.'],
    ],
  },
  footer: 'WorthIt 2026. This is a demo. Products and prices are sample data.',
};

export type Copy = typeof en;
