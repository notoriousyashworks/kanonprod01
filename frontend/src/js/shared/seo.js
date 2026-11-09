/* ============================================
   SEO helpers — canonical URLs, indexing rules and <head> tags.
   Shared by the Node SSR renderer and the browser bundle. DOM-free.

   Everything emitted here comes from real catalog data or facts the store
   publishes. No ratings, reviews or brand claims are ever generated.
   ============================================ */
import { escapeAttr, escapeHtml, safeJson } from './escape.js';
import { categoryHref, productHref, slugify, displayDescription } from './templates.js';
import { categoryContent } from './category-content.js';

/** Canonical origin. Never derived from the request Host header. */
export const SITE = 'https://kicksaura.in';
export const BRAND = 'Kicks Aura';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
export const ROBOTS_NOINDEX = 'noindex, follow';
export const DEFAULT_OG_IMAGE = `${SITE}/images/banner_01.jpg`;
export const LOGO_URL = `${SITE}/logos/logo-600.png`;

/** Public, indexable static pages (path → file in dist). */
export const STATIC_PAGES = {
  '/about-us': 'about-us.html',
  '/contact-us': 'contact-us.html',
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

/** Extract the product UUID from /product/<slug>-<uuid>; null if there is none. */
export function parseProductPath(pathname) {
  const m = /^\/product\/(?:.*-)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(pathname);
  return m ? m[1].toLowerCase() : null;
}

/** Extract the slug from /category/<slug>; null if the path isn't a category page. */
export function parseCategoryPath(pathname) {
  const m = /^\/category\/([a-z0-9-]+)$/.exec(pathname);
  return m ? m[1] : null;
}

export function findCategoryBySlug(categories, slug) {
  return (categories || []).find(c => slugify(c.name) === slug) || null;
}

export function productTitle(product) {
  return `${String(product.name || 'Product').trim()} | ${BRAND}`;
}

/**
 * Factual description: the product's own description when it has one,
 * otherwise a sentence assembled only from real fields (name, category, price).
 */
export function productDescription(product) {
  const own = displayDescription(product);
  if (own) return truncate(own);
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
export function listingTitle(info, page = 1) {
  const suffix = page > 1 ? ` – Page ${page}` : '';
  if (info.newArrivals) return `New Arrivals: Latest Sneakers & Watches${suffix} | ${BRAND}`;
  if (info.category) {
    const copy = categoryContent(slugify(info.category));
    return `${copy ? copy.title : `Buy ${info.category} Online in India`}${suffix} | ${BRAND}`;
  }
  if (info.indexable) return `Shop Sneakers, Watches & Accessories Online${suffix} | ${BRAND}`;
  return null;
}

/** Description for a category listing; null keeps the page's own static description. */
export function listingDescription(info, page = 1) {
  const prefix = page > 1 ? `Page ${page}: ` : '';
  if (info.newArrivals) return truncate(`${prefix}See the latest sneakers and watches added to ${BRAND}. Cash on delivery available across India, with delivery in 4–5 working days.`);
  if (info.category) {
    const copy = categoryContent(slugify(info.category));
    return truncate(prefix + (copy ? copy.description : `Shop ${info.category} at ${BRAND}. Cash on delivery available across India and extra savings on prepaid orders.`));
  }
  if (info.indexable && page > 1) return truncate(`${prefix}Browse sneakers, watches, sunglasses, perfumes and more at ${BRAND}. Cash on delivery available across India.`);
  return null;
}

/* ---------- structured data (JSON-LD) ---------- */

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE}/#organization`,
    name: BRAND,
    url: `${SITE}/`,
    logo: LOGO_URL,
    email: 'kicksauraa@gmail.com',
    telephone: '+91-6239379751',
    sameAs: ['https://instagram.com/kicksauraa'],
    address: { '@type': 'PostalAddress', addressLocality: 'Chandigarh', addressCountry: 'IN' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: '+91-6239379751',
      email: 'kicksauraa@gmail.com',
      areaServed: 'IN',
    },
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: BRAND,
    url: `${SITE}/`,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE}/#organization` },
  };
}

/** items: [{ name, href? }]; the current page (last item) has no link. */
export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

/**
 * Product + Offer. Deliberately omitted:
 * - brand: pending the owner's decision (see docs/seo/final-seo-report.md); the
 *   catalog's brand values are also unreliable ("Unknown" on many products).
 * - sku: variant SKUs aren't unique, and many products have none.
 * - aggregateRating/review: the store has no genuine rating data.
 * - any compared/"original" price: only the actual selling price is declared.
 */
export function productLd(product, canonicalUrl) {
  const images = (product.imageUrls || []).map(safeHttpUrl).filter(Boolean).slice(0, 5);
  const price = product.discountedPrice || product.basePrice;
  const hasOffer = price != null && !Number.isNaN(Number(price));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    url: canonicalUrl,
    description: productDescription(product),
    ...(product.category ? { category: product.category } : {}),
    ...(images.length ? { image: images } : {}),
    ...(hasOffer ? {
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        price: Number(price).toFixed(2),
        priceCurrency: 'INR',
        availability: product.inStockFlag === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        seller: { '@id': `${SITE}/#organization` },
      },
    } : {}),
  };
}

export function productCanonicalPath(product) {
  return productHref(product.id, product.name || '');
}

/** Only absolute http(s) URLs may be emitted in meta tags. */
export function safeHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : '';
}

/**
 * Build the SEO <head> tags owned by the renderer. Only real values are
 * emitted; absent fields are skipped.
 */
export function buildHeadTags({ canonical, robots, og = {}, jsonLd = [], preloadImage } = {}) {
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
    const image = og.image || DEFAULT_OG_IMAGE;
    tags.push(`<meta property="og:image" content="${escapeAttr(image)}" />`);
    tags.push('<meta name="twitter:card" content="summary_large_image" />');
    tags.push(`<meta name="twitter:title" content="${escapeAttr(og.title)}" />`);
    if (og.description) tags.push(`<meta name="twitter:description" content="${escapeAttr(og.description)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeAttr(image)}" />`);
  }
  if (preloadImage) tags.push(`<link rel="preload" as="image" href="${escapeAttr(preloadImage)}" fetchpriority="high" />`);
  for (const data of jsonLd) tags.push(`<script type="application/ld+json">${safeJson(data)}</script>`);
  return tags.join('\n  ');
}

export { escapeHtml };
