import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fillRegion, setTitle, setMetaDescription, stripManagedHead, appendToHead, embedData, replaceH1Text,
} from '../render.js';
import { pagesSitemap, categoriesSitemap, productsSitemap, sitemapProducts, sitemapIndex, productChunkCount, PRODUCTS_PER_SITEMAP } from '../sitemap.js';

const TPL = `<!DOCTYPE html><html><head>
  <title>Old</title>
  <meta name="description" content="old" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://kicksaura.in/products" />
  <meta property="og:title" content="Old" />
</head><body>
<div id="navbar-container"><!--ssr:navbar-->static nav<!--/ssr:navbar--></div>
<h1 class="category-title" id="products-page-title">All Products</h1>
<div id="g"><!--ssr:grid--><!--/ssr:grid--></div>
<script type="module" src="/assets/x.js"></script>
</body></html>`;

test('fillRegion keeps replacement text verbatim (no $& / $1 expansion)', () => {
  const out = fillRegion(TPL, 'grid', 'A $& B $1 C');
  assert.ok(out.includes('<!--ssr:grid-->A $& B $1 C<!--/ssr:grid-->'));
});

test('fillRegion replaces previously baked content and ignores missing regions', () => {
  assert.ok(fillRegion(TPL, 'navbar', 'NEW').includes('<!--ssr:navbar-->NEW<!--/ssr:navbar-->'));
  assert.equal(fillRegion(TPL, 'nope', 'x'), TPL);
});

test('setTitle / setMetaDescription escape and never expand $&', () => {
  const out = setMetaDescription(setTitle(TPL, 'Tom $& <Jerry>'), 'D $1 "q"');
  assert.ok(out.includes('<title>Tom $&amp; &lt;Jerry&gt;</title>'));
  assert.ok(out.includes('<meta name="description" content="D $1 &quot;q&quot;" />'));
});

test('stripManagedHead removes canonical/robots (and og when asked) only', () => {
  const out = stripManagedHead(TPL, { og: true });
  assert.ok(!out.includes('rel="canonical"'));
  assert.ok(!out.includes('name="robots"'));
  assert.ok(!out.includes('og:title'));
  assert.ok(out.includes('name="description"'));
  assert.ok(stripManagedHead(TPL).includes('og:title'));
});

test('appendToHead / embedData / replaceH1Text', () => {
  let out = appendToHead(TPL, '<link rel="canonical" href="x" />');
  assert.match(out, /<link rel="canonical" href="x" \/>\n<\/head>/);
  out = embedData(out, { product: { name: '</script>$&' } });
  assert.match(out, /<script type="application\/json" id="ka-ssr-data">.*<\/script>\n<\/body>/);
  assert.ok(!out.includes('</script>$&'));
  out = replaceH1Text(out, 'products-page-title', 'Mens $& Watches');
  assert.ok(out.includes('id="products-page-title">Mens $&amp; Watches</h1>'));
});

/* ---------- sitemaps ---------- */

const CATS = [{ name: 'Sneakers' }, { name: 'Mens Watches' }];

test('sitemapProducts keeps visible products in active categories, de-duplicated', () => {
  const list = sitemapProducts([
    { id: 'a', category: 'Sneakers' },
    { id: 'a', category: 'Sneakers' },
    { id: 'b', category: 'Handbags' },
    { id: 'c', category: 'mens watches' },
    { id: 'd', category: 'Sneakers', visible: false },
    { category: 'Sneakers' },
  ], CATS);
  assert.deepEqual(list.map(p => p.id), ['a', 'c']);
});

test('sitemap XML: absolute canonical URLs, encoded, chunked', () => {
  assert.ok(pagesSitemap().includes('<loc>https://kicksaura.in/</loc>'));
  assert.ok(pagesSitemap().includes('<loc>https://kicksaura.in/shipping-policy</loc>'));
  assert.ok(!pagesSitemap().includes('checkout') && !pagesSitemap().includes('profile'));
  assert.ok(categoriesSitemap(CATS).includes('<loc>https://kicksaura.in/category/mens-watches</loc>'));
  assert.ok(pagesSitemap().includes('<loc>https://kicksaura.in/blog/sneaker-care-guide</loc>'));
  const many = Array.from({ length: PRODUCTS_PER_SITEMAP + 1 }, (_, i) => ({ id: `id-${i}`, name: 'A B' }));
  assert.equal(productChunkCount(many), 2);
  assert.equal(productChunkCount([]), 1);
  assert.equal((productsSitemap(many, 2).match(/<loc>/g) || []).length, 1);
  assert.ok(sitemapIndex(2).includes('<loc>https://kicksaura.in/sitemaps/products-2.xml</loc>'));
});

test('product sitemap: slug URLs, image tag, lastmod only from a real updatedAt', () => {
  const xml = productsSitemap([
    { id: 'x1', name: 'Red Shoe', imageUrls: ['https://cdn/a.webp?x=1&y=2'], updatedAt: '2026-11-01T10:00:00', createdAt: '2026-01-01T00:00:00' },
    { id: 'x2', name: 'Blue Shoe', createdAt: '2026-01-01T00:00:00' },
  ], 1);
  assert.ok(xml.includes('/product/red-shoe-x1</loc><lastmod>2026-11-01</lastmod>'));
  assert.ok(xml.includes('a.webp?x=1&amp;y=2'));
  assert.ok(xml.includes('/product/blue-shoe-x2</loc></url>'), 'createdAt is not used as lastmod');
});
