/* ============================================
   XML sitemaps (sitemap index + child sitemaps), generated from live catalog data.

   Included: homepage, /products, /new-arrivals, active categories, public info
   and policy pages, the blog, and every visible product in an active category.
   Excluded: checkout, orders, profile, search/filter/price URLs, admin, API,
   products in categories the admin has deactivated.

   <lastmod> is only emitted when the product has a real updatedAt; createdAt
   is never used as a stand-in for "last modified".
   ============================================ */
import { escapeHtml } from '../src/js/shared/escape.js';
import { categoryHref, productHref } from '../src/js/shared/templates.js';
import { SITE, STATIC_PAGES, safeHttpUrl } from '../src/js/shared/seo.js';
import { BLOG_POSTS } from '../src/js/shared/blog-posts.js';

export const PRODUCTS_PER_SITEMAP = 5000;

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

function urlset(paths) {
  const body = paths.map(p => `  <url><loc>${escapeHtml(SITE + p)}</loc></url>`).join('\n');
  return `${XML_HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function pagesSitemap() {
  return urlset(['/', '/products', '/new-arrivals', ...Object.keys(STATIC_PAGES), '/blog', ...BLOG_POSTS.map(p => `/blog/${p.slug}`)]);
}

export function categoriesSitemap(categories) {
  return urlset(categories.map(c => categoryHref(c.name)));
}

/** Products that belong in the sitemap (visible via the public API, active category). */
export function sitemapProducts(products, categories) {
  const active = new Set(categories.map(c => String(c.name).toLowerCase()));
  const seen = new Set();
  return products.filter(p => {
    if (!p || !p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    if (p.visible === false) return false;
    return active.has(String(p.category || '').toLowerCase());
  });
}

export function productChunkCount(products) {
  return Math.max(1, Math.ceil(products.length / PRODUCTS_PER_SITEMAP));
}

/** @param {number} n 1-based chunk number */
export function productsSitemap(products, n) {
  const start = (n - 1) * PRODUCTS_PER_SITEMAP;
  const body = products.slice(start, start + PRODUCTS_PER_SITEMAP).map((p) => {
    const image = safeHttpUrl(p.imageUrls?.[0]);
    const lastmod = /^\d{4}-\d{2}-\d{2}/.test(String(p.updatedAt || '')) ? String(p.updatedAt).slice(0, 10) : '';
    return `  <url><loc>${escapeHtml(SITE + productHref(p.id, p.name || ''))}</loc>`
      + (lastmod ? `<lastmod>${lastmod}</lastmod>` : '')
      + (image ? `<image:image><image:loc>${escapeHtml(image)}</image:loc></image:image>` : '')
      + '</url>';
  }).join('\n');
  return `${XML_HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export function sitemapIndex(productChunks) {
  const files = ['pages.xml', 'categories.xml'];
  for (let i = 1; i <= productChunks; i++) files.push(`products-${i}.xml`);
  const body = files.map(f => `  <sitemap><loc>${SITE}/sitemaps/${f}</loc></sitemap>`).join('\n');
  return `${XML_HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
