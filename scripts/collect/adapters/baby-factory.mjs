/** Baby Factory: the sitemap lists categories, so discovery reads category pages for product links (up to 40 a run). */
export default {
  id: 'baby-factory',
  name: 'Baby Factory',
  origin: 'https://www.babyfactory.co.nz',
  kind: 'product',
  enabled: true,
  discovery: { maxListings: 40 },
  // Defaults cover this site: listing fallback with JSON product links, JSON-LD Product.
};
