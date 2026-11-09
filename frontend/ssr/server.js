/* ============================================
   Kicks Aura storefront SSR renderer.

   A small Node HTTP server (no dependencies) that nginx proxies public HTML
   document routes to. It takes the Vite-built page, fetches catalog data from
   the API gateway, and returns HTML that already contains the real content,
   per-URL <head> tags and correct HTTP status codes. The same HTML is served
   to every visitor; the page's own JavaScript then takes over as before.

   If this process is down or slow, nginx serves the static file instead
   (error_page 502 504 = @static), i.e. the site behaves exactly as before.

   Env: SSR_PORT (3000), SSR_HOST (127.0.0.1), SSR_DIST, SSR_API_BASE,
        SSR_WHATSAPP_NUMBER, SSR_API_TIMEOUT_MS, SSR_MAX_CARDS.
   ============================================ */
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import {
  loadTemplate, fillRegion, setTitle, setMetaDescription, stripManagedHead,
  appendToHead, embedData, replaceH1Text, DIST_DIR,
} from './render.js';
import * as api from './api.js';
import * as sitemap from './sitemap.js';
import {
  navbarHTML, footerHTML, productCardHTML, categoryCardHTML, productDetailHTML,
  buildProductView, activeChipsHTML, breadcrumbsHTML, viewMoreHTML, relatedSectionHTML,
  categoryHref, slugify,
} from '../src/js/shared/templates.js';
import { categoryCopyHTML } from '../src/js/shared/category-content.js';
import {
  SITE, UUID_RE, ROBOTS_INDEX, ROBOTS_NOINDEX, absoluteUrl, productTitle,
  productDescription, classifyListing, listingTitle, listingDescription,
  productCanonicalPath, buildHeadTags, safeHttpUrl, parseProductPath, parseCategoryPath,
  findCategoryBySlug, organizationLd, websiteLd, breadcrumbLd, productLd,
} from '../src/js/shared/seo.js';
import { timeSeededShuffle } from '../src/js/shuffle.js';

const PORT = Number(process.env.SSR_PORT || 3000);
const HOST = process.env.SSR_HOST || '127.0.0.1';
const WHATSAPP = process.env.SSR_WHATSAPP_NUMBER || undefined;
const MAX_CARDS = Number(process.env.SSR_MAX_CARDS || 500);

// Fields that the storefront never uses and that shouldn't be echoed into HTML.
const PRIVATE_PRODUCT_FIELDS = ['sourceSite', 'sourceProductId', 'searchText', 'originalName', 'searchName', 'searchBrand'];

function log(level, msg, extra = {}) {
  process.stdout.write(JSON.stringify({ t: new Date().toISOString(), level, msg, ...extra }) + '\n');
}

/* ---------- shared page chrome ---------- */

function withChrome(html, activePage, categories) {
  let out = fillRegion(html, 'navbar', navbarHTML(activePage, { categories: categories || [] }));
  out = fillRegion(out, 'footer', footerHTML());
  return out;
}

const categoriesOrNull = () => api.getCategories().catch((err) => {
  log('warn', 'categories unavailable', { err: String(err.message || err) });
  return null;
});

/** Same ordering as the browser: in-stock shuffled with a 12h seed, sold-out last. */
function orderInStockFirst(products, extraSeed) {
  const inStock = products.filter(p => p.inStockFlag !== false);
  const outOfStock = products.filter(p => p.inStockFlag === false);
  return [...timeSeededShuffle(inStock, extraSeed), ...outOfStock];
}

/* ---------- routes ---------- */

export async function renderNotFound(categories) {
  const tpl = loadTemplate('404.html');
  const html = tpl ? withChrome(tpl, 'policy', categories) : '<!DOCTYPE html><title>Page Not Found</title><h1>Page Not Found</h1>';
  return { status: 404, html, headers: { 'X-Robots-Tag': ROBOTS_NOINDEX } };
}

export async function renderHome() {
  const [categories, arrivals] = await Promise.all([
    categoriesOrNull(),
    api.getNewArrivals(0, 16).catch(() => null),
  ]);
  let html = loadTemplate('index.html');
  html = stripManagedHead(html);
  html = appendToHead(html, buildHeadTags({ canonical: `${SITE}/`, robots: ROBOTS_INDEX, jsonLd: [organizationLd(), websiteLd()] }));
  html = withChrome(html, 'home', categories);
  if (arrivals && arrivals.length) {
    // landing.js: timeSeededShuffle(inStock, 1) + outOfStock, rendered with createProductCard
    html = fillRegion(html, 'new-arrivals', orderInStockFirst(arrivals, 1).map((p, i) => productCardHTML(p, { eager: i < 4 })).join(''));
  }
  if (categories && categories.length) {
    html = fillRegion(html, 'categories', categories.map(c => categoryCardHTML(c)).join(''));
  }
  return { status: 200, html };
}

/** ?page=N (1-based). Returns null for anything that isn't a clean page number > 1. */
function parsePage(params) {
  const raw = params.get('page');
  return raw && /^[1-9]\d{0,4}$/.test(raw) && Number(raw) > 1 ? Number(raw) : null;
}

/** Render products.html for an indexable or faceted listing state. */
async function renderListingPage(info, categories, pageNumber = 1) {
  const page0 = pageNumber - 1;
  let html = loadTemplate('products.html');
  html = stripManagedHead(html, { og: info.indexable });

  let gridHTML = '';
  let totalPages = 1;
  if (info.indexable) {
    const cats = info.category ? [info.category] : [];
    // products.js: Sneakers load 500 at once, other listings 16 (orderBatch seed 2 + page)
    const size = cats.some(c => /sneaker/i.test(c)) ? 500 : 16;
    const load = info.newArrivals
      ? api.getNewArrivalsPage(page0, 16)
      : api.filterProducts({ categories: cats }, page0, size);
    const data = await load.catch(() => null);
    if (data && Array.isArray(data.content)) {
      if (!data.content.length && page0 > 0) return renderNotFound(categories);
      totalPages = data.totalPages || 1;
      gridHTML = orderInStockFirst(data.content, 2 + page0)
        .slice(0, MAX_CARDS)
        .map((p, i) => productCardHTML(p, { eager: i < 4 }))
        .join('');
    } else if (page0 > 0) {
      return { status: 503, html: loadTemplate('products.html'), headers: { 'Retry-After': '120' } };
    }
  }

  const basePath = info.canonicalPath;
  const pagePath = (n) => (n > 1 ? `${basePath}?page=${n}` : basePath);
  const canonical = basePath ? absoluteUrl(pagePath(pageNumber)) : null;
  const title = listingTitle(info, pageNumber);
  const description = listingDescription(info, pageNumber);
  const crumbs = info.indexable && basePath !== '/products'
    ? [{ name: 'Home', href: '/' }, { name: 'All Products', href: '/products' }, { name: info.h1 }]
    : null;

  html = setTitle(html, title);
  html = setMetaDescription(html, description);
  html = appendToHead(html, buildHeadTags({
    canonical,
    robots: info.indexable ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    og: info.indexable ? {
      title: title || 'Shop Sneakers, Watches & Accessories Online | Kicks Aura',
      description: description || 'Browse sneakers, watches, sunglasses, perfumes and more at Kicks Aura.',
      url: canonical,
    } : undefined,
    jsonLd: crumbs ? [breadcrumbLd(crumbs)] : [],
  }));
  html = replaceH1Text(html, 'products-page-title', info.h1);
  html = withChrome(html, 'products', categories);
  if (crumbs) html = fillRegion(html, 'breadcrumbs', breadcrumbsHTML(crumbs));
  if (info.category) html = fillRegion(html, 'chips', activeChipsHTML([info.category]));
  if (gridHTML) {
    const more = pageNumber < totalPages ? viewMoreHTML(pagePath(pageNumber + 1)) : '';
    html = fillRegion(html, 'grid', gridHTML + more);
  }
  if (info.category && pageNumber === 1) {
    html = fillRegion(html, 'category-copy', categoryCopyHTML(slugify(info.category), info.category));
  }
  if (info.category) html = embedData(html, { listing: { category: info.category } });

  return { status: 200, html, headers: info.indexable ? {} : { 'X-Robots-Tag': ROBOTS_NOINDEX } };
}

/** Query string to keep across a redirect (campaign tags, not the params being consolidated). */
function keptQuery(params, drop) {
  const kept = new URLSearchParams();
  for (const [k, v] of params) if (!drop.includes(k)) kept.append(k, v);
  const qs = kept.toString();
  return qs ? `?${qs}` : '';
}

export async function renderListing(params) {
  const categories = await categoriesOrNull();
  const asksForCategory = params.has('categories') || params.has('category');
  if (!categories && asksForCategory) {
    // Can't tell whether the category exists — ask crawlers to retry, users get the normal page.
    return { status: 503, html: loadTemplate('products.html'), headers: { 'Retry-After': '120' } };
  }
  const info = classifyListing(params, (categories || []).map(c => c.name));
  // One known category and nothing else → its clean URL is the only version.
  if (info.category) {
    return { status: 301, location: info.canonicalPath + keptQuery(params, ['categories', 'category']) };
  }
  if (params.has('page') && !parsePage(params) && info.indexable) {
    return { status: 301, location: `/products${keptQuery(params, ['page'])}` };
  }
  return renderListingPage(info, categories, info.indexable ? (parsePage(params) || 1) : 1);
}

export async function renderCategory(slug, params) {
  const categories = await categoriesOrNull();
  if (!categories) return { status: 503, html: loadTemplate('products.html'), headers: { 'Retry-After': '120' } };
  const category = findCategoryBySlug(categories, slug);
  if (!category) return renderNotFound(categories);
  const path = categoryHref(category.name);
  if (params.has('page') && !parsePage(params)) return { status: 301, location: path + keptQuery(params, ['page']) };
  const info = { indexable: true, canonicalPath: path, category: category.name, trending: false, h1: category.name };
  return renderListingPage(info, categories, parsePage(params) || 1);
}

export async function renderNewArrivals(params) {
  const categories = await categoriesOrNull();
  if (params.has('page') && !parsePage(params)) return { status: 301, location: `/new-arrivals${keptQuery(params, ['page'])}` };
  const info = { indexable: true, canonicalPath: '/new-arrivals', newArrivals: true, category: null, trending: false, h1: 'New Arrivals' };
  return renderListingPage(info, categories, parsePage(params) || 1);
}

/** Legacy /product-details?id=<uuid> → 301 to the canonical slug URL. */
export async function renderLegacyProduct(params) {
  const rawId = (params.get('id') || '').trim();
  if (!rawId) return { status: 301, location: '/products' };
  if (!UUID_RE.test(rawId)) return renderNotFound(await categoriesOrNull());
  try {
    const product = await api.getProduct(rawId.toLowerCase());
    return { status: 301, location: productCanonicalPath(product) + keptQuery(params, ['id']) };
  } catch (err) {
    if (err instanceof api.NotFoundError) return renderNotFound(await categoriesOrNull());
    return { status: 503, html: loadTemplate('product-details.html'), headers: { 'Retry-After': '120' } };
  }
}

/** Up to 8 in-stock products from the same category, stable per product for 12h. */
async function relatedProducts(product) {
  if (!product.category) return [];
  const data = await api.filterProducts({ categories: [product.category] }, 0, 40).catch(() => null);
  const pool = (data?.content || []).filter(p => String(p.id) !== String(product.id) && p.inStockFlag !== false);
  const seed = [...String(product.id)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return timeSeededShuffle(pool, seed).slice(0, 8);
}

export async function renderProductPage(pathname, params) {
  const id = parseProductPath(pathname);
  if (!id) return renderNotFound(await categoriesOrNull());

  const [catsResult, productResult] = await Promise.allSettled([api.getCategories(), api.getProduct(id)]);
  const categories = catsResult.status === 'fulfilled' ? catsResult.value : null;
  if (productResult.status === 'rejected') {
    if (productResult.reason instanceof api.NotFoundError) return renderNotFound(categories);
    log('warn', 'product unavailable', { id, err: String(productResult.reason?.message || productResult.reason) });
    return { status: 503, html: loadTemplate('product-details.html'), headers: { 'Retry-After': '120' } };
  }

  const product = { ...productResult.value };
  for (const f of PRIVATE_PRODUCT_FIELDS) delete product[f];

  // A stale or edited slug resolves to the one canonical URL.
  const canonicalPath = productCanonicalPath(product);
  if (pathname !== canonicalPath) return { status: 301, location: canonicalPath + keptQuery(params, []) };

  const canonical = absoluteUrl(canonicalPath);
  const title = productTitle(product);
  const description = productDescription(product);
  const view = buildProductView(product);
  const image = safeHttpUrl(product.imageUrls?.[0]);

  // Link the category only while it is active: deactivated ones have no page.
  const activeCategory = (categories || []).find(c => c.name.toLowerCase() === String(product.category || '').toLowerCase());
  const crumbs = [
    { name: 'Home', href: '/' },
    activeCategory ? { name: activeCategory.name, href: categoryHref(activeCategory.name) } : { name: 'All Products', href: '/products' },
    { name: product.name },
  ];
  const related = await relatedProducts(product);

  let html = loadTemplate('product-details.html');
  html = setTitle(html, title);
  html = setMetaDescription(html, description);
  html = stripManagedHead(html, { og: true });
  html = appendToHead(html, buildHeadTags({
    canonical,
    robots: ROBOTS_INDEX,
    og: { type: 'product', title, description, url: canonical, image },
    jsonLd: [productLd(product, canonical), breadcrumbLd(crumbs)],
    preloadImage: view.images[0],
  }));
  html = withChrome(html, 'product', categories);
  html = fillRegion(html, 'breadcrumbs', breadcrumbsHTML(crumbs));
  html = fillRegion(html, 'product', productDetailHTML(product, view, {
    liked: false, whatsappNumber: WHATSAPP, origin: SITE,
  }));
  if (related.length) html = fillRegion(html, 'related', relatedSectionHTML(related));
  html = embedData(html, { product });
  return { status: 200, html };
}

async function sitemapData() {
  const [categories, products] = await Promise.all([api.getCategories(), api.getAllProducts()]);
  return { categories, products: sitemap.sitemapProducts(products, categories) };
}

export async function renderSitemap(path) {
  const xml = (body) => ({ status: 200, body, type: 'application/xml; charset=utf-8', headers: { 'Cache-Control': 'public, max-age=3600' } });
  try {
    if (path === '/sitemap.xml') {
      const { products } = await sitemapData();
      return xml(sitemap.sitemapIndex(sitemap.productChunkCount(products)));
    }
    if (path === '/sitemaps/pages.xml') return xml(sitemap.pagesSitemap());
    if (path === '/sitemaps/categories.xml') return xml(sitemap.categoriesSitemap(await api.getCategories()));
    const m = /^\/sitemaps\/products-(\d{1,3})\.xml$/.exec(path);
    if (m) {
      const n = Number(m[1]);
      const { products } = await sitemapData();
      if (n >= 1 && n <= sitemap.productChunkCount(products)) return xml(sitemap.productsSitemap(products, n));
    }
    return { status: 404, body: 'Not Found', type: 'text/plain; charset=utf-8' };
  } catch (err) {
    log('error', 'sitemap failed', { path, err: String(err.message || err) });
    return { status: 503, body: 'Sitemap temporarily unavailable', type: 'text/plain; charset=utf-8', headers: { 'Retry-After': '300' } };
  }
}

const ROUTES = {
  '/': () => renderHome(),
  '/products': (params) => renderListing(params),
  '/new-arrivals': (params) => renderNewArrivals(params),
  '/product-details': (params) => renderLegacyProduct(params),
};

function routeFor(path) {
  if (ROUTES[path]) return { handler: ROUTES[path], template: path === '/' ? 'index.html' : path === '/product-details' ? 'product-details.html' : 'products.html' };
  if (path.startsWith('/product/')) return { handler: (params) => renderProductPage(path, params), template: 'product-details.html', critical: true };
  const slug = parseCategoryPath(path);
  if (slug) return { handler: (params) => renderCategory(slug, params), template: 'products.html', critical: true };
  return null;
}

/* ---------- HTTP ---------- */

export async function handle(method, rawUrl) {
  if (method !== 'GET' && method !== 'HEAD') {
    return { status: 405, body: 'Method Not Allowed', type: 'text/plain; charset=utf-8', headers: { Allow: 'GET, HEAD' } };
  }
  // Fixed base: a request target like "//evil.com" must never become the host.
  const url = new URL('http://ssr.internal' + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl));
  const path = url.pathname.replace(/\/{2,}/g, '/');

  if (path === '/healthz') return { status: 200, body: 'ok', type: 'text/plain; charset=utf-8' };
  if (path === '/sitemap.xml' || path.startsWith('/sitemaps/')) return renderSitemap(path);

  const route = routeFor(path);
  if (!route) return renderNotFound(await categoriesOrNull());
  try {
    return await route.handler(url.searchParams);
  } catch (err) {
    log('error', 'render failed', { path, err: String(err.stack || err) });
    const status = route.critical ? 503 : 200;
    return { status, html: loadTemplate(route.template), headers: { 'X-SSR': 'error', ...(status === 503 ? { 'Retry-After': '120' } : {}) } };
  }
}

function send(res, result, headOnly) {
  const headers = { 'X-SSR': '1', ...(result.headers || {}) };
  if (result.location) {
    res.writeHead(result.status, { ...headers, Location: result.location, 'Content-Length': 0 });
    return res.end();
  }
  const isHtml = result.html !== undefined;
  const body = Buffer.from(isHtml ? (result.html || '') : (result.body || ''), 'utf8');
  res.writeHead(result.status, {
    'Content-Type': isHtml ? 'text/html; charset=utf-8' : (result.type || 'text/plain; charset=utf-8'),
    'Cache-Control': 'no-cache',
    ...headers,
    'Content-Length': body.length,
  });
  res.end(headOnly ? undefined : body);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const started = Date.now();
    let result;
    try {
      result = await handle(req.method, req.url || '/');
    } catch (err) {
      log('error', 'unhandled', { url: req.url, err: String(err.stack || err) });
      result = { status: 500, body: 'Internal Server Error', type: 'text/plain; charset=utf-8' };
    }
    send(res, result, req.method === 'HEAD');
    if (result.status >= 500) log('warn', 'response', { url: req.url, status: result.status, ms: Date.now() - started });
  });
}

// Start only when run directly (tests import the handlers).
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  if ((123456).toLocaleString('en-IN') !== '1,23,456') {
    log('warn', 'ICU data missing: en-IN number formatting differs from the browser (install icu-data-full)');
  }
  for (const f of ['index.html', 'products.html', 'product-details.html', '404.html']) {
    if (!loadTemplate(f)) log('error', 'template missing', { file: f, dist: DIST_DIR });
  }
  const server = createServer();
  server.listen(PORT, HOST, () => log('info', 'ssr listening', { host: HOST, port: PORT, dist: DIST_DIR, api: api.API_BASE }));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  // Warm the cache so the first visitors don't wait on the API.
  Promise.allSettled([api.getCategories(), api.getNewArrivals(0, 16)]).catch(() => {});
}
