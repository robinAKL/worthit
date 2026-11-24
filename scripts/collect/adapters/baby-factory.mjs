/** Baby Factory: the sitemap lists categories, so discovery reads category pages for product links (up to 150 a run, about 5 minutes at 2 seconds each). */
export default {
  id: 'baby-factory',
  name: 'Baby Factory',
  origin: 'https://www.babyfactory.co.nz',
  kind: 'product',
  enabled: true,
  discovery: { maxListings: 150 },
  // Defaults cover this site: listing fallback with JSON product links, JSON-LD Product.
};
