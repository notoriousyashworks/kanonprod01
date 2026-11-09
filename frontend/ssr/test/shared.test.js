import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, safeJson } from '../../src/js/shared/escape.js';
import {
  productCardHTML, productDetailHTML, navbarHTML, footerHTML, categoryCardHTML,
  categoryHref, productHref, activeChipsHTML, buildProductView, slugify, displayDescription,
  breadcrumbsHTML, viewMoreHTML,
} from '../../src/js/shared/templates.js';
import {
  classifyListing, productDescription, productTitle, truncate, productCanonicalPath,
  safeHttpUrl, buildHeadTags, UUID_RE, parseProductPath, parseCategoryPath, productLd,
  organizationLd, breadcrumbLd, listingTitle,
} from '../../src/js/shared/seo.js';

const EVIL = '"><img src=x onerror=alert(1)>';
const ID = 'bc14dfaf-6ac5-48b9-b247-b5e0e5eea832';

function product(overrides = {}) {
  return {
    id: ID,
    name: 'Nike Cortez Metallic Silver',
    category: 'Sneakers',
    description: '',
    basePrice: 18889,
    discountedPrice: 2598,
    imageUrls: ['https://cdn.example.com/a.webp', 'https://cdn.example.com/b.webp'],
    videoUrls: [],
    variants: [{ id: 'v1', size: 'UK 8', stockQuantity: 3 }, { id: 'v2', size: 'UK 7', stockQuantity: 0 }],
    inStockFlag: true,
    ...overrides,
  };
}

test('escapeHtml escapes markup and quotes', () => {
  assert.equal(escapeHtml(EVIL), '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(0), '0');
});

test('safeJson cannot break out of a <script> element', () => {
  const out = safeJson({ name: '</script><script>alert(1)</script>', sep: ' ' });
  assert.ok(!out.includes('</script>'));
  assert.ok(!out.includes(' '));
  assert.deepEqual(JSON.parse(out), { name: '</script><script>alert(1)</script>', sep: ' ' });
});

test('en-IN price formatting matches the browser (needs full ICU)', () => {
  assert.equal((123456).toLocaleString('en-IN'), '1,23,456');
});

test('product card escapes untrusted product data', () => {
  const html = productCardHTML(product({ name: EVIL, category: '<b>x</b>' }));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(html.includes(`/product/`) && html.includes(`-${ID}"`));
  assert.ok(html.includes('₹2,598') && html.includes('₹18,889'));
});

test('product card reflects wishlist state only when asked', () => {
  assert.ok(!productCardHTML(product()).includes('pc-heart-btn active'));
  assert.ok(productCardHTML(product(), { liked: true }).includes('pc-heart-btn active'));
});

test('product card tolerates a missing price', () => {
  assert.doesNotThrow(() => productCardHTML(product({ basePrice: null, discountedPrice: null })));
});

test('product detail markup: escaped H1, sorted sizes, first image eager', () => {
  const p = product({ name: EVIL });
  const html = productDetailHTML(p, buildProductView(p), { whatsappNumber: '911234567890' });
  assert.ok(html.includes('<h1 class="product-title pd-title-modern">&quot;&gt;&lt;img'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.indexOf('UK 7') < html.indexOf('UK 8'), 'sizes sorted numerically');
  assert.match(html, /size-btn size-btn--oos"[\s\S]*?disabled title="Out of stock"/);
  assert.ok(html.includes('src="https://cdn.example.com/a.webp"'));
  assert.ok(html.includes('data-src="https://cdn.example.com/b.webp"'));
  assert.ok(html.includes('https://wa.me/911234567890?text='));
});

test('product detail: out-of-stock product shows the disabled button', () => {
  const html = productDetailHTML(product({ inStockFlag: false }));
  assert.ok(html.includes('OUT OF STOCK'));
  assert.ok(!html.includes('id="add-to-cart-btn"'));
});

test('navbar pre-fills category links only when categories are given', () => {
  assert.ok(navbarHTML('home').includes('<!-- Categories injected via JS -->'));
  const html = navbarHTML('home', { categories: [{ name: 'Mens Watches' }] });
  assert.ok(html.includes('href="/category/mens-watches" class="nav-dropdown-link">Mens Watches</a>'));
});

test('footer links the key public pages', () => {
  for (const href of ['/products', '/new-arrivals', '/blog', '/contact-us', '/refund-policy']) {
    assert.ok(footerHTML().includes(`href="${href}"`), href);
  }
});

test('clean URLs: categories and products', () => {
  assert.equal(categoryHref('Mens Sunglasses'), '/category/mens-sunglasses');
  assert.equal(categoryHref('Crocs / Flip-Flop'), '/category/crocs-flip-flop');
  assert.ok(categoryCardHTML({ name: 'Belts', imageUrl: '' }).includes('href="/category/belts"'));
  assert.equal(productHref(ID, "Men's Air 90!"), `/product/men-s-air-90-${ID}`);
  assert.equal(productHref(ID, ''), `/product/${ID}`);
  assert.equal(productHref(ID), `/product-details?id=${ID}`);
  assert.equal(parseProductPath(`/product/men-s-air-90-${ID.toUpperCase()}`), ID);
  assert.equal(parseProductPath(`/product/${ID}`), ID);
  assert.equal(parseProductPath('/product/no-id-here'), null);
  assert.equal(parseCategoryPath('/category/mens-watches'), 'mens-watches');
  assert.equal(parseCategoryPath('/category/a/b'), null);
  assert.ok(slugify('x'.repeat(200)).length <= 80);
});

test('imported belt text is never shown on non-belt products', () => {
  const text = 'Classic black belt with a clean, versatile design for everyday and formal wear.';
  assert.equal(displayDescription(product({ category: 'Ladies Sunglasses', description: text })), '');
  assert.equal(displayDescription(product({ category: 'Belts', description: text })), text);
  assert.equal(displayDescription(product({ description: 'short' })), '');
  assert.ok(!productDescription(product({ category: 'Ladies Sunglasses', description: text })).includes('belt'));
});

test('breadcrumbs: last item is not a link; values escaped', () => {
  const html = breadcrumbsHTML([{ name: 'Home', href: '/' }, { name: '<x>', href: '/ignored' }]);
  assert.ok(html.includes('<a href="/">Home</a>'));
  assert.ok(html.includes('<span aria-current="page">&lt;x&gt;</span>'));
  assert.ok(viewMoreHTML('/category/belts?page=2').includes('href="/category/belts?page=2"'));
});

test('Product JSON-LD: real offer only; no brand, sku, ratings or compared price', () => {
  const url = `https://kicksaura.in/product/x-${ID}`;
  const ld = productLd(product(), url);
  assert.equal(ld['@type'], 'Product');
  assert.equal(ld.offers.price, '2598.00');
  assert.equal(ld.offers.priceCurrency, 'INR');
  assert.equal(ld.offers.availability, 'https://schema.org/InStock');
  assert.equal(productLd(product({ inStockFlag: false }), url).offers.availability, 'https://schema.org/OutOfStock');
  for (const banned of ['brand', 'sku', 'aggregateRating', 'review']) assert.equal(ld[banned], undefined, banned);
  assert.ok(!JSON.stringify(ld).includes('18889'));
  assert.equal(productLd(product({ basePrice: null, discountedPrice: null }), url).offers, undefined);
});

test('Organization and breadcrumb JSON-LD', () => {
  assert.equal(organizationLd().address.addressCountry, 'IN');
  assert.equal(organizationLd().address.streetAddress, undefined);
  const crumbs = breadcrumbLd([{ name: 'Home', href: '/' }, { name: 'Now' }]);
  assert.equal(crumbs.itemListElement[0].item, 'https://kicksaura.in/');
  assert.equal(crumbs.itemListElement[1].item, undefined);
});

test('listing titles: unique per category and page', () => {
  assert.equal(listingTitle({ category: 'Sneakers', indexable: true }), 'Buy Sneakers Online in India | Kicks Aura');
  assert.equal(listingTitle({ category: 'Sneakers', indexable: true }, 2), 'Buy Sneakers Online in India – Page 2 | Kicks Aura');
  assert.equal(listingTitle({ indexable: false }), null);
});

test('chips are escaped', () => {
  assert.ok(activeChipsHTML(['<x>']).includes('&lt;x&gt;'));
});

/* ---------- seo.js ---------- */

const ACTIVE = ['Sneakers', 'Mens Watches', 'Belts'];
const classify = (qs) => classifyListing(new URLSearchParams(qs), ACTIVE);

test('listing: plain /products is indexable with a self canonical', () => {
  assert.deepEqual(
    { i: classify('').indexable, c: classify('').canonicalPath },
    { i: true, c: '/products' },
  );
});

test('listing: a single known category is indexable, canonical uses the DB name', () => {
  const r = classify('categories=mens%20watches&utm_source=ig&gclid=1');
  assert.equal(r.indexable, true);
  assert.equal(r.category, 'Mens Watches');
  assert.equal(r.canonicalPath, '/category/mens-watches');
});

test('listing: legacy ?category= maps to the same canonical', () => {
  assert.equal(classify('category=Belts').canonicalPath, '/category/belts');
});

test('listing: facets, search, multi-category, trending, unknown → noindex, no canonical', () => {
  for (const qs of ['categories=Sneakers,Belts', 'search=nike', 'categories=Sneakers&minPrice=1000',
    'brands=Nike', 'trending=true', 'categories=Handbags']) {
    const r = classify(qs);
    assert.equal(r.indexable, false, qs);
    assert.equal(r.canonicalPath, null, qs);
  }
});

test('product canonical is lowercased and parameter-free', () => {
  assert.equal(productCanonicalPath({ id: ID.toUpperCase(), name: 'Red Shoe' }), `/product/red-shoe-${ID}`);
  assert.ok(UUID_RE.test(ID) && !UUID_RE.test('abc') && !UUID_RE.test(`${ID}x`));
});

test('product title and description use only real data', () => {
  assert.equal(productTitle(product()), 'Nike Cortez Metallic Silver | Kicks Aura');
  const d = productDescription(product());
  assert.ok(d.includes('Nike Cortez Metallic Silver') && d.includes('Sneakers') && d.includes('₹2,598'));
  const own = 'A genuinely written description of this product that is long enough to be used as is.';
  assert.equal(productDescription(product({ description: own })), own);
  assert.ok(truncate('word '.repeat(80)).length <= 156);
});

test('meta tags: only http(s) image URLs; values escaped', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl('https://x/y.webp'), 'https://x/y.webp');
  const tags = buildHeadTags({ canonical: 'https://kicksaura.in/a?b="c"', robots: 'index, follow', og: { title: EVIL } });
  assert.ok(!tags.includes('"><img'));
  assert.ok(tags.includes('<meta name="robots" content="index, follow" />'));
});

test('templates have balanced <div> tags (server-parsed HTML must not leak out of its container)', () => {
  const bal = (h) => (h.match(/<div\b/g) || []).length - (h.match(/<\/div>/g) || []).length;
  const p = product({ videoUrls: ['https://cdn.example.com/v.mp4'] });
  for (const [name, html] of Object.entries({
    navbar: navbarHTML('home', { categories: [{ name: 'Sneakers' }] }),
    footer: footerHTML(),
    card: productCardHTML(p),
    detail: productDetailHTML(p),
    detailOutOfStock: productDetailHTML(product({ inStockFlag: false })),
    category: categoryCardHTML({ name: 'Belts', imageUrl: '' }),
  })) assert.equal(bal(html), 0, name);
});

test('product cards request a resized Bunny image; other CDNs keep their transforms', () => {
  const bunny = productCardHTML(product({ imageUrls: ['https://x.b-cdn.net/a.jpg'] }));
  assert.ok(bunny.includes('src="https://x.b-cdn.net/a.jpg?width=480&amp;quality=75"'));
  const ik = productCardHTML(product({ imageUrls: ['https://ik.imagekit.io/a.jpg'] }));
  assert.ok(ik.includes('tr=q-auto,f-auto,w-800'));
});
