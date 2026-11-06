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
  buildProductView, activeChipsHTML,
} from '../src/js/shared/templates.js';
import {
  SITE, UUID_RE, ROBOTS_INDEX, ROBOTS_NOINDEX, absoluteUrl, productTitle,
  productDescription, classifyListing, listingTitle, listingDescription,
  productCanonicalPath, buildHeadTags, safeHttpUrl,
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
  out = fillRegion(out, 'footer', footerHTML({ whatsappNumber: WHATSAPP }));
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
  html = appendToHead(html, buildHeadTags({ canonical: `${SITE}/`, robots: ROBOTS_INDEX }));
  html = withChrome(html, 'home', categories);
  if (arrivals && arrivals.length) {
    // landing.js: timeSeededShuffle(inStock, 1) + outOfStock, rendered with createProductCard
    html = fillRegion(html, 'new-arrivals', orderInStockFirst(arrivals, 1).map(p => productCardHTML(p)).join(''));
  }
  if (categories && categories.length) {
    html = fillRegion(html, 'categories', categories.map(c => categoryCardHTML(c)).join(''));
  }
  return { status: 200, html };
}

export async function renderListing(params) {
  const categories = await categoriesOrNull();
  const asksForCategory = params.has('categories') || params.has('category');
  if (!categories && asksForCategory) {
    // Can't tell whether the category exists — ask crawlers to retry, users get the normal page.
    return { status: 503, html: loadTemplate('products.html'), headers: { 'Retry-After': '120' } };
  }

  const info = classifyListing(params, (categories || []).map(c => c.name));
  let html = loadTemplate('products.html');
  html = stripManagedHead(html, { og: !!info.category });

  let total;
  let gridHTML = '';
  if (info.indexable) {
    const cats = info.category ? [info.category] : [];
    // products.js: Sneakers load 500 at once, other listings 16 (orderBatch seed 2 + page)
    const size = cats.some(c => /sneaker/i.test(c)) ? 500 : 16;
    const page = await api.filterProducts({ categories: cats }, 0, size).catch(() => null);
    if (page && Array.isArray(page.content) && page.content.length) {
      total = page.totalElements;
      gridHTML = orderInStockFirst(page.content, 2).slice(0, MAX_CARDS).map(p => productCardHTML(p)).join('');
    }
  }

  const canonical = info.canonicalPath ? absoluteUrl(info.canonicalPath) : null;
  const title = listingTitle(info);
  const description = listingDescription(info, total);
  html = setTitle(html, title);
  html = setMetaDescription(html, description);
  html = appendToHead(html, buildHeadTags({
    canonical,
    robots: info.indexable ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    og: info.category ? { title, description, url: canonical } : undefined,
  }));
  html = replaceH1Text(html, 'products-page-title', info.h1);
  html = withChrome(html, 'products', categories);
  if (info.category) html = fillRegion(html, 'chips', activeChipsHTML([info.category]));
  if (gridHTML) html = fillRegion(html, 'grid', gridHTML);

  return { status: 200, html, headers: info.indexable ? {} : { 'X-Robots-Tag': ROBOTS_NOINDEX } };
}

export async function renderProductPage(params) {
  const rawId = (params.get('id') || '').trim();
  if (!rawId) return { status: 301, location: '/products' };
  if (!UUID_RE.test(rawId)) return renderNotFound(await categoriesOrNull());

  const [catsResult, productResult] = await Promise.allSettled([api.getCategories(), api.getProduct(rawId.toLowerCase())]);
  const categories = catsResult.status === 'fulfilled' ? catsResult.value : null;
  if (productResult.status === 'rejected') {
    if (productResult.reason instanceof api.NotFoundError) return renderNotFound(categories);
    log('warn', 'product unavailable', { id: rawId, err: String(productResult.reason?.message || productResult.reason) });
    return { status: 503, html: loadTemplate('product-details.html'), headers: { 'Retry-After': '120' } };
  }

  const product = { ...productResult.value };
  for (const f of PRIVATE_PRODUCT_FIELDS) delete product[f];

  const canonical = absoluteUrl(productCanonicalPath(product.id));
  const title = productTitle(product);
  const description = productDescription(product);

  let html = loadTemplate('product-details.html');
  html = setTitle(html, title);
  html = setMetaDescription(html, description);
  html = stripManagedHead(html, { og: true });
  html = appendToHead(html, buildHeadTags({
    canonical,
    robots: ROBOTS_INDEX,
    og: { type: 'product', title: product.name, description, url: canonical, image: safeHttpUrl(product.imageUrls?.[0]) },
  }));
  html = withChrome(html, 'product', categories);
  html = fillRegion(html, 'product', productDetailHTML(product, buildProductView(product), {
    liked: false, whatsappNumber: WHATSAPP, origin: SITE,
  }));
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
  '/product-details': (params) => renderProductPage(params),
};

// Template to fall back to if a renderer throws unexpectedly.
const RAW_TEMPLATE = { '/': 'index.html', '/products': 'products.html', '/product-details': 'product-details.html' };

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

  const route = ROUTES[path];
  if (!route) return renderNotFound(await categoriesOrNull());
  try {
    return await route(url.searchParams);
  } catch (err) {
    log('error', 'render failed', { path, err: String(err.stack || err) });
    const status = path === '/product-details' ? 503 : 200;
    return { status, html: loadTemplate(RAW_TEMPLATE[path]), headers: { 'X-SSR': 'error', ...(status === 503 ? { 'Retry-After': '120' } : {}) } };
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
