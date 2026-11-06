/* ============================================
   SEO helpers — canonical URLs, indexing rules and <head> tags.
   Shared by the Node SSR renderer and the browser bundle. DOM-free.

   Phase 1 scope: correct canonicals, robots directives and factual per-URL
   titles/descriptions built only from real catalog data. Copywriting and
   keyword targeting are refined in Phase 2; JSON-LD comes in Phase 4.
   ============================================ */
import { escapeAttr, escapeHtml } from './escape.js';
import { categoryHref, productHref } from './templates.js';

/** Canonical origin. Never derived from the request Host header. */
export const SITE = 'https://kicksaura.in';
export const BRAND = 'Kicks Aura';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
export const ROBOTS_NOINDEX = 'noindex, follow';

/** Public, indexable static pages (path → file in dist). */
export const STATIC_PAGES = {
  '/about-us': 'about-us.html',
  '/shipping-policy': 'shipping-policy.html',
  '/return-exchange': 'return-exchange.html',
  '/refund-policy': 'refund-policy.html',
  '/privacy-policy': 'privacy-policy.html',
  '/terms-conditions': 'terms-conditions.html',
};

export function absoluteUrl(path) {
  return SITE + path;
}

/** Collapse whitespace and cut at a word boundary. */
export function truncate(text, max = 155) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, '') + '…';
}

const fmtINR = (p) => (p != null && !Number.isNaN(Number(p))) ? '₹' + Number(p).toLocaleString('en-IN') : '';

export function productTitle(product) {
  return `${String(product.name || 'Product').trim()} | ${BRAND}`;
}

/**
 * Factual description: the product's own description when it has one,
 * otherwise a sentence assembled only from real fields (name, category, price).
 */
export function productDescription(product) {
  const own = String(product.description || '').trim();
  if (own.length >= 40) return truncate(own);
  const price = fmtINR(product.discountedPrice || product.basePrice);
  const parts = [`Buy ${String(product.name || '').trim()}`];
  if (product.category) parts[0] += ` in ${product.category}`;
  parts[0] += ` at ${BRAND}`;
  if (price) parts[0] += ` for ${price}`;
  parts[0] += '.';
  parts.push('Cash on delivery available across India.');
  return truncate(parts.join(' '));
}

/**
 * Classify a /products request.
 * @param {URLSearchParams} params
 * @param {string[]} activeCategories  names of active categories
 * @returns {{indexable: boolean, canonicalPath: string, category: string|null, trending: boolean, h1: string}}
 */
export function classifyListing(params, activeCategories = []) {
  const lookup = new Map(activeCategories.map(n => [n.toLowerCase(), n]));
  const cats = (params.get('categories') || '').split(',').map(s => s.trim()).filter(Boolean);
  const legacy = (params.get('category') || '').trim();
  if (legacy && legacy.toLowerCase() !== 'all') cats.push(legacy);
  const uniqueCats = [...new Set(cats.map(c => c.toLowerCase()))];

  const hasFacet = ['search', 'brands', 'minPrice', 'maxPrice'].some(k => params.has(k) && params.get(k) !== '');
  const trending = params.get('trending') === 'true';

  // Single, known category with no other facets → indexable category page.
  if (uniqueCats.length === 1 && !hasFacet && !trending) {
    const match = lookup.get(uniqueCats[0]);
    if (match) {
      return { indexable: true, canonicalPath: categoryHref(match), category: match, trending: false, h1: match };
    }
    // Unknown or deactivated category: crawlable, not indexed, no canonical.
    return { indexable: false, canonicalPath: null, category: null, trending: false, h1: cats[0] };
  }

  if (uniqueCats.length === 0 && !hasFacet) {
    // The trending view holds at most 8 products (thin) — crawlable, not indexed.
    if (trending) return { indexable: false, canonicalPath: null, category: null, trending: true, h1: 'Trending Products' };
    return { indexable: true, canonicalPath: '/products', category: null, trending: false, h1: 'All Products' };
  }

  // Faceted / multi-category / search views: keep links crawlable, don't index.
  // No canonical: mixing noindex with a canonical elsewhere sends conflicting signals.
  const h1 = trending ? 'Trending Products'
    : params.get('search') ? 'Search Results'
    : uniqueCats.length > 1 ? 'Multiple Categories'
    : uniqueCats.length === 1 ? (lookup.get(uniqueCats[0]) || cats[0])
    : 'All Products';
  return { indexable: false, canonicalPath: null, category: null, trending, h1 };
}

/** Title for a category listing; null keeps the page's own static title. */
export function listingTitle(info) {
  if (info.category) return `${info.category} | ${BRAND}`;
  return null;
}

/** Description for a category listing; null keeps the page's own static description. */
export function listingDescription(info, total) {
  if (info.category) {
    const count = Number.isFinite(total) && total > 0 ? `${total} ` : '';
    return truncate(`Shop ${count}${info.category} at ${BRAND}. Cash on delivery available across India and extra savings on prepaid orders.`);
  }
  return null;
}

export function productCanonicalPath(id) {
  return productHref(String(id).toLowerCase());
}

/** Only absolute http(s) URLs may be emitted in meta tags. */
export function safeHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : '';
}

/**
 * Build the SEO <head> tags owned by the renderer. Only real values are
 * emitted; absent fields are skipped.
 */
export function buildHeadTags({ canonical, robots, og = {} } = {}) {
  const tags = [];
  if (robots) tags.push(`<meta name="robots" content="${escapeAttr(robots)}" />`);
  if (canonical) tags.push(`<link rel="canonical" href="${escapeAttr(canonical)}" />`);
  if (og.title) {
    tags.push(`<meta property="og:type" content="${escapeAttr(og.type || 'website')}" />`);
    tags.push(`<meta property="og:site_name" content="${BRAND}" />`);
    tags.push(`<meta property="og:locale" content="en_IN" />`);
    tags.push(`<meta property="og:title" content="${escapeAttr(og.title)}" />`);
    if (og.description) tags.push(`<meta property="og:description" content="${escapeAttr(og.description)}" />`);
    if (og.url) tags.push(`<meta property="og:url" content="${escapeAttr(og.url)}" />`);
    if (og.image) tags.push(`<meta property="og:image" content="${escapeAttr(og.image)}" />`);
  }
  return tags.join('\n  ');
}

export { escapeHtml };
