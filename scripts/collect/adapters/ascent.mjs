/** Ascent: product pages are productspecification.aspx?itemID=N and carry JSON-LD Product. */
export default {
  id: 'ascent',
  name: 'Ascent',
  origin: 'https://www.ascent.co.nz',
  kind: 'product',
  enabled: true,
  // The sitemaps are sorted by product id, which runs category by category: sample evenly instead.
  discovery: { spread: true },
  // Defaults cover this site: robots sitemaps, product sitemap first, JSON-LD Product.
};
