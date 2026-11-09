// Route-level tests: the SSR handlers against a stub API gateway and a fixture
// dist directory. No network access.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ID = 'bc14dfaf-6ac5-48b9-b247-b5e0e5eea832';
const MISSING = '00000000-0000-4000-8000-000000000000';
const PRODUCT = {
  id: ID, name: 'Nike Cortez $& <Silver>', category: 'Sneakers', description: '',
  basePrice: 18889, discountedPrice: 2598, imageUrls: ['https://cdn.example.com/a.webp'], videoUrls: [],
  variants: [{ id: 'v1', size: 'UK 8', stockQuantity: 3 }], inStockFlag: true,
  sourceSite: 'supplier.example', sourceProductId: '123', searchText: 'internal',
};
const OTHER = { ...PRODUCT, id: '11111111-2222-4333-8444-555555555555', name: 'Classic Belt', category: 'Belts' };
const HIDDEN_CATEGORY = { ...PRODUCT, id: '22222222-2222-4333-8444-555555555555', category: 'Handbags' };

let api;
let apiDown = false;
let dist;
let ssr;

const page = (content, extra = {}) => ({ content, totalElements: content.length, totalPages: 1, last: true, ...extra });

const TEMPLATE = (body) => `<!DOCTYPE html><html lang="en"><head>
  <title>Static</title>
  <meta name="description" content="static description" />
  <meta name="robots" content="index, follow" />
  <meta property="og:url" content="https://kicksaura.in/products" />
</head><body>
<div id="navbar-container"><!--ssr:navbar--><!--/ssr:navbar--></div>
${body}
<div id="footer-container"><!--ssr:footer--><!--/ssr:footer--></div>
</body></html>`;

before(async () => {
  api = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://stub');
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (apiDown) return json(500, { error: 'down' });
    const p = url.pathname;
    if (p === '/api/v1/categories') return json(200, [{ name: 'Sneakers', active: true }, { name: 'Belts', active: true }]);
    if (p === '/api/v1/products/new-arrivals') return json(200, page([PRODUCT, OTHER]));
    if (p === '/api/v1/products/filter') {
      const cat = url.searchParams.get('categories');
      const n = Number(url.searchParams.get('page') || 0);
      if (cat === 'Belts') return json(200, page(n < 2 ? [OTHER] : [], { totalPages: 2, totalElements: 17 }));
      return json(200, page([PRODUCT, OTHER].filter(x => !cat || x.category === cat)));
    }
    if (p === '/api/v1/products') return json(200, page([PRODUCT, OTHER, HIDDEN_CATEGORY]));
    if (p === `/api/v1/products/${ID}`) return json(200, PRODUCT);
    if (p.startsWith('/api/v1/products/')) return json(404, { error: 'not found' });
    return json(404, {});
  });
  await new Promise(r => api.listen(0, '127.0.0.1', r));

  dist = mkdtempSync(join(tmpdir(), 'ka-ssr-'));
  writeFileSync(join(dist, 'index.html'), TEMPLATE(`<div id="new-arrivals-grid"><!--ssr:new-arrivals--><div class="skeleton"></div><!--/ssr:new-arrivals--></div>
<div id="category-grid"><!--ssr:categories--><!--/ssr:categories--></div>`));
  writeFileSync(join(dist, 'products.html'), TEMPLATE(`<h1 class="category-title" id="products-page-title">All Products</h1>
<div id="active-chips-row"><!--ssr:chips--><!--/ssr:chips--></div>
<!--ssr:breadcrumbs--><!--/ssr:breadcrumbs-->
<div id="products-grid"><!--ssr:grid--><!--/ssr:grid--></div>
<div id="category-copy"><!--ssr:category-copy--><!--/ssr:category-copy--></div>`));
  writeFileSync(join(dist, 'product-details.html'), TEMPLATE(`<!--ssr:breadcrumbs--><!--/ssr:breadcrumbs--><div id="product-container"><!--ssr:product--><span>Loading product…</span><!--/ssr:product--></div><!--ssr:related--><!--/ssr:related-->`));
  writeFileSync(join(dist, '404.html'), TEMPLATE(`<h1>Page Not Found</h1>`).replace('index, follow', 'noindex, follow'));

  process.env.SSR_DIST = dist;
  process.env.SSR_API_BASE = `http://127.0.0.1:${api.address().port}/api/v1`;
  process.env.SSR_API_TIMEOUT_MS = '1000';
  ssr = await import('../server.js');
});

after(() => {
  api.close();
  rmSync(dist, { recursive: true, force: true });
});

async function get(path, { fresh = true } = {}) {
  if (fresh) (await import('../api.js')).clearCache();
  return ssr.handle('GET', path);
}
const canonicalOf = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
const robotsOf = (html) => [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map(m => m[1]);

const PRODUCT_PATH = `/product/nike-cortez-silver-${ID}`;

test('product page: 200, real title, canonical, escaped H1, JSON-LD, embedded data without internal fields', async () => {
  const r = await get(`${PRODUCT_PATH}?utm_source=x`);
  assert.equal(r.status, 200);
  assert.ok(r.html.includes('<title>Nike Cortez $&amp; &lt;Silver&gt; | Kicks Aura</title>'));
  assert.equal(canonicalOf(r.html), `https://kicksaura.in${PRODUCT_PATH}`);
  assert.deepEqual(robotsOf(r.html), ['index, follow, max-image-preview:large']);
  assert.ok(r.html.includes('<h1 class="product-title pd-title-modern">Nike Cortez $&amp; &lt;Silver&gt;</h1>'));
  assert.ok(r.html.includes('og:image" content="https://cdn.example.com/a.webp"'));
  assert.ok(r.html.includes('name="twitter:card"'));
  assert.ok(r.html.includes('rel="preload" as="image" href="https://cdn.example.com/a.webp"'));
  assert.ok(!r.html.includes('Loading product…'));
  assert.ok(r.html.includes('href="/category/belts" class="nav-dropdown-link"'), 'navbar categories pre-filled');
  assert.ok(r.html.includes('<a href="/category/sneakers">Sneakers</a>'), 'breadcrumb links the active category');
  const ld = [...r.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.deepEqual(ld.map(x => x['@type']), ['Product', 'BreadcrumbList']);
  assert.equal(ld[0].offers.price, '2598.00');
  assert.equal(ld[0].brand, undefined);
  const data = JSON.parse(r.html.match(/id="ka-ssr-data">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.product.id, ID);
  assert.equal(data.product.sourceSite, undefined);
  assert.ok(!r.html.includes('supplier.example'));
});

test('product URLs: legacy, stale slug and uppercase ids 301 to the canonical URL', async () => {
  for (const path of [`/product-details?id=${ID.toUpperCase()}`, `/product/old-name-${ID}`, `/product/${ID}`]) {
    const r = await get(path);
    assert.equal(r.status, 301, path);
    assert.equal(r.location, PRODUCT_PATH, path);
  }
  assert.equal((await get(`/product-details?id=${ID}&utm_source=x`)).location, `${PRODUCT_PATH}?utm_source=x`);
});

test('product page: unknown, malformed and missing ids', async () => {
  const unknown = await get(`/product/foo-${MISSING}`);
  assert.equal(unknown.status, 404);
  assert.match(unknown.headers['X-Robots-Tag'], /noindex/);
  assert.equal((await get(`/product-details?id=${MISSING}`)).status, 404);
  assert.equal((await get('/product/no-uuid')).status, 404);
  assert.equal((await get('/product-details?id=../../admin')).status, 404);
  const missing = await get('/product-details');
  assert.equal(missing.status, 301);
  assert.equal(missing.location, '/products');
});

test('product page: API failure → 503 + Retry-After with the untouched static page', async () => {
  apiDown = true;
  try {
    const r = await get(PRODUCT_PATH);
    assert.equal(r.status, 503);
    assert.equal(r.headers['Retry-After'], '120');
    assert.ok(r.html.includes('Loading product…'));
  } finally {
    apiDown = false;
  }
});

test('category page: indexable, self canonical, H1, chips, breadcrumb, copy, cards', async () => {
  const r = await get('/category/sneakers?utm_campaign=x');
  assert.equal(r.status, 200);
  assert.equal(canonicalOf(r.html), 'https://kicksaura.in/category/sneakers');
  assert.deepEqual(robotsOf(r.html), ['index, follow, max-image-preview:large']);
  assert.ok(r.html.includes('<title>Buy Sneakers Online in India | Kicks Aura</title>'));
  assert.ok(r.html.includes('id="products-page-title">Sneakers</h1>'));
  assert.ok(r.html.includes('filter-chip filter-chip--active'));
  assert.ok(r.html.includes('class="category-copy"'));
  assert.ok(r.html.includes('aria-current="page">Sneakers'));
  assert.ok(r.html.includes(`-${ID}"`));
  assert.ok(!r.html.includes('Classic Belt'), 'only this category');
  assert.ok(!r.html.includes('og:url" content="https://kicksaura.in/products"'), 'static og replaced');
  assert.equal((await get('/category/handbags')).status, 404, 'deactivated categories have no page');
});

test('legacy category URLs 301 to the clean URL, keeping campaign tags', async () => {
  const s = await get('/products?categories=sneakers&utm_campaign=x');
  assert.equal(s.status, 301);
  assert.equal(s.location, '/category/sneakers?utm_campaign=x');
  assert.equal((await get('/products?category=Belts')).location, '/category/belts');
});

test('pagination: crawlable next link, self canonical per page, out of range 404', async () => {
  const first = await get('/category/belts');
  assert.ok(first.html.includes('href="/category/belts?page=2"'), 'next link');
  const second = await get('/category/belts?page=2');
  assert.equal(second.status, 200);
  assert.equal(canonicalOf(second.html), 'https://kicksaura.in/category/belts?page=2');
  assert.ok(second.html.includes('Page 2'));
  assert.ok(!second.html.includes('class="category-copy"'), 'intro copy only on page 1');
  assert.equal((await get('/category/belts?page=99')).status, 404);
  assert.equal((await get('/category/belts?page=1')).location, '/category/belts');
  assert.equal((await get('/category/belts?page=abc')).location, '/category/belts');
});

test('new arrivals page', async () => {
  const r = await get('/new-arrivals');
  assert.equal(r.status, 200);
  assert.equal(canonicalOf(r.html), 'https://kicksaura.in/new-arrivals');
  assert.ok(r.html.includes('id="products-page-title">New Arrivals</h1>'));
  assert.ok(r.html.includes('product-card-link'));
});

test('listing: faceted / unknown views are noindex without canonical and without a grid', async () => {
  for (const qs of ['?search=nike', '?categories=Sneakers,Belts', '?categories=Handbags', '?trending=true']) {
    const r = await get(`/products${qs}`);
    assert.equal(r.status, 200, qs);
    assert.deepEqual(robotsOf(r.html), ['noindex, follow'], qs);
    assert.equal(canonicalOf(r.html), undefined, qs);
    assert.equal(r.headers['X-Robots-Tag'], 'noindex, follow', qs);
    assert.ok(!r.html.includes('class="product-card-link"'), qs);
  }
});

test('listing: category requested while the API is down → 503', async () => {
  apiDown = true;
  try {
    assert.equal((await get('/products?categories=Sneakers')).status, 503);
    assert.equal((await get('/category/sneakers')).status, 503);
  } finally {
    apiDown = false;
  }
});

test('homepage: canonical, new arrivals and category cards rendered', async () => {
  const r = await get('/?utm_source=x');
  assert.equal(r.status, 200);
  assert.equal(canonicalOf(r.html), 'https://kicksaura.in/');
  assert.ok(!r.html.includes('class="skeleton"'));
  assert.ok(r.html.includes('class="category-card"'));
  assert.ok(r.html.includes('href="/category/sneakers" class="category-card"'));
  const ld = [...r.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.deepEqual(ld.map(x => x['@type']), ['OnlineStore', 'WebSite']);
});

test('homepage still renders (200) when the API is down', async () => {
  apiDown = true;
  try {
    const r = await get('/');
    assert.equal(r.status, 200);
    assert.ok(r.html.includes('class="skeleton"'));
  } finally {
    apiDown = false;
  }
});

test('sitemaps: index + children, hidden categories excluded, valid structure', async () => {
  const index = await get('/sitemap.xml');
  assert.equal(index.status, 200);
  assert.match(index.type, /xml/);
  assert.ok(index.body.includes('<sitemapindex'));
  const products = await get('/sitemaps/products-1.xml');
  assert.ok(products.body.includes(`https://kicksaura.in${PRODUCT_PATH}`));
  assert.ok(!products.body.includes(HIDDEN_CATEGORY.id));
  assert.equal((await get('/sitemaps/products-9.xml')).status, 404);
  apiDown = true;
  try {
    assert.equal((await get('/sitemap.xml')).status, 503);
  } finally {
    apiDown = false;
  }
});

test('unknown paths, odd request targets and methods', async () => {
  assert.equal((await get('/nope')).status, 404);
  assert.equal((await get('//evil.com/x')).status, 404);
  assert.equal((await ssr.handle('POST', '/')).status, 405);
  assert.equal((await get('/healthz')).status, 200);
});
