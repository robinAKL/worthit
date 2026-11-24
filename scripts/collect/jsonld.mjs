const DROPPED = new Set(['description', 'review', 'reviews', 'image', 'images', 'imageUrl']);

export function productsFromHtml(html, pageUrl, merchant, capturedAt) {
  const blocks = [...String(html ?? '').matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const found = [];
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block[1].trim());
    } catch {
      continue;
    }
    for (const node of flatten(data)) {
      const row = toRow(node, pageUrl, merchant, capturedAt);
      if (row) found.push(row);
    }
  }
  return found;
}

function flatten(data) {
  if (Array.isArray(data)) return data.flatMap(flatten);
  if (!data || typeof data !== 'object') return [];
  const graph = Array.isArray(data['@graph']) ? data['@graph'].flatMap(flatten) : [];
  return [data, ...graph];
}

function toRow(node, pageUrl, merchant, capturedAt) {
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
    category: categoryFor(title),
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

function categoryFor(title) {
  const value = title.toLowerCase();
  if (/laptop|notebook|macbook/.test(value)) return 'laptop';
  if (/phone|iphone|smartphone/.test(value)) return 'phone';
  if (/desk|chair|sofa|table/.test(value)) return 'furniture';
  return 'other';
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
