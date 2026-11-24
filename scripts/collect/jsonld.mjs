const DROPPED = new Set(['description', 'review', 'reviews', 'image', 'images', 'imageUrl']);

export function productsFromHtml(html, pageUrl, merchant, capturedAt) {
  const blocks = [...String(html ?? '').matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = [];
  for (const block of blocks) {
    try {
      nodes.push(...flatten(JSON.parse(block[1].trim())));
    } catch {
      /* A broken script does not discard the other blocks. */
    }
  }
  return nodes.map((node) => toRow(node, pageUrl, merchant, capturedAt, nodes)).filter(Boolean);
}

function flatten(data) {
  if (Array.isArray(data)) return data.flatMap(flatten);
  if (!data || typeof data !== 'object') return [];
  const graph = Array.isArray(data['@graph']) ? data['@graph'].flatMap(flatten) : [];
  return [data, ...graph];
}

function toRow(node, pageUrl, merchant, capturedAt, nodes) {
  const type = node['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (!types.some((item) => String(item).toLowerCase() === 'product')) return null;
  const offer = firstOffer(node.offers);
  const price = number(offer?.price);
  const currency = String(offer?.priceCurrency ?? '').toUpperCase();
  const title = text(node.name);
  const url = text(node.url) || pageUrl;
  if (!title || !price || currency !== 'NZD' || !url.startsWith('https://')) return null;
  const brand = text(node.brand?.name ?? node.brand);
  const model = text(node.sku || node.mpn || node.model);
  const specs = {};
  if (brand) specs.brand = brand;
  if (model) specs.model = model;
  const stock = availability(offer?.availability);
  if (stock) specs.stock = stock;
  for (const prop of node.additionalProperty ?? []) {
    const key = text(prop?.name);
    const value = text(prop?.value);
    if (!key || !value || DROPPED.has(key.toLowerCase())) continue;
    specs[key] = value.slice(0, 80);
  }
  return {
    id: idFor(url),
    title: title.slice(0, 180),
    category: categoryFor(node, nodes, title),
    price,
    currency: 'NZD',
    merchant,
    url,
    imageCount: countImages(node.image),
    condition: 'new',
    capturedAt,
    specs,
  };
}

function firstOffer(offers) {
  if (Array.isArray(offers)) return offers[0];
  if (offers?.['@type'] === 'AggregateOffer' && Array.isArray(offers.offers)) return offers.offers[0];
  return offers;
}

function countImages(image) {
  if (!image) return 0;
  if (typeof image === 'string') return 1;
  if (Array.isArray(image)) return image.filter(Boolean).length;
  return 0;
}

function availability(value) {
  const textValue = text(value).toLowerCase();
  if (!textValue) return '';
  if (textValue.includes('instock')) return 'in stock';
  if (textValue.includes('outofstock')) return 'out of stock';
  if (textValue.includes('preorder')) return 'preorder';
  return '';
}

function categoryFor(node, nodes, title) {
  const named = categoryText(node.category);
  if (named) return slug(named);
  for (const other of nodes) {
    if (!hasType(other, 'breadcrumblist')) continue;
    const names = (other.itemListElement ?? [])
      .map((item) => text(item?.name ?? item?.item?.name))
      .filter((name) => name && !/^(home|ascent|baby factory)$/i.test(name));
    const leaf = names.at(-1);
    if (leaf) return slug(leaf);
  }
  const value = title.toLowerCase();
  if (/laptop|notebook|macbook/.test(value)) return 'laptop';
  if (/phone|iphone|smartphone/.test(value)) return 'phone';
  if (/desk|chair|sofa|table/.test(value)) return 'furniture';
  return 'uncategorised';
}

function categoryText(category) {
  if (!category) return '';
  if (Array.isArray(category)) return categoryText(category.at(-1));
  if (typeof category === 'object') return text(category.name);
  return text(category);
}

function slug(value) {
  const leaf = value.split(/[>/|]/).pop() ?? value;
  const slugText = leaf
    .toLowerCase()
    .replace(/&amp;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return slugText || 'uncategorised';
}

function hasType(node, type) {
  const value = node?.['@type'];
  const types = Array.isArray(value) ? value : [value];
  return types.some((item) => String(item).toLowerCase() === type);
}

function idFor(url) {
  let hash = 0;
  for (const char of url) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `feed-${hash.toString(16)}`;
}

function number(value) {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function text(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
