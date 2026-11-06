# Kicks Aura — Phase 1: Technical SEO Audit & Crawlability Fixes

**Site:** https://kicksaura.in · **Audit date:** 6 Nov 2026 · **Scope:** Phase 1 (technical audit, rendering/indexing, plus robots.txt and sitemap brought forward from Phase 5)

> No claims are made here about rankings or indexing. Those can only be measured in Google Search Console after deployment.

---

## 1. Stack (verified from the repository)

| Layer | What it is |
|---|---|
| Storefront | Vite 6 multi-page site, vanilla JS (`frontend/`), 12 HTML pages, no framework |
| Backend | Spring Boot microservices: `api-gateway`, `product-service`, `order-service`, `user-service`; PostgreSQL on the VPS host |
| Media | Bunny CDN (images, video), with legacy Cloudinary and ImageKit URLs |
| Serving | GitHub Actions → GHCR images → `docker compose` on a VPS. The **host nginx** (TLS, not in this repo) proxies `kicksaura.in` → `frontend` container (`nginx:alpine`, `127.0.0.1:5173`), and `admin.kicksaura.in` → `admin` container |
| Catalog (live, 6 Nov) | 2,139 visible products. 8 active categories: Sneakers, Mens Watches, Ladies Watches, Mens Sunglasses, Ladies Sunglasses, Belts, Wallets, Perfumes. Products are also served from 2 deactivated categories (Handbags 258, Crocs / Flip-Flop 7) |

---

## 2. Live-site state before Phase 1 (curl, 6 Nov 2026)

| Request | Response | Problem |
|---|---|---|
| `/robots.txt` | 200 `text/html` (homepage) | No robots.txt |
| `/sitemap.xml` | 200 `text/html` (homepage) | No sitemap |
| `/this-does-not-exist`, `/admin`, `/favicon.ico`, `/cart`, `/products/` | 200, homepage | Soft 404s: every URL "exists" |
| `/index` | 200, homepage | Duplicate of `/` |
| `/products.html` | 301 → **http**://kicksaura.in/products → 301 https | Redirect chain with a protocol downgrade |
| `https://www.kicksaura.in/` | 200, identical page | www/apex duplicate (no redirect) |
| `/product-details?id=<uuid>` | 200; body = "Loading product…" spinner; title "Product Details — KicksAura" for all 2,139 products | No crawlable product content |
| `/product-details?id=<bogus>` | 200 with "Could not load product" | Soft 404 |
| `/products?categories=Sneakers` | 200; canonical → `https://kicksaura.in/products`; H1 "All Products"; empty grid | Every category declares itself a duplicate of `/products` |
| `/google5feebd35865e4497.html` | 301 → homepage | HTML-file verification broken (the meta-tag verification works) |
| `admin.kicksaura.in` | 200, no noindex, no X-Robots-Tag | Admin panel is indexable |
| `/assets/*.js`, `*.css` | no `Cache-Control`, not compressed | Repeat visits re-download everything |

---

## 3. Findings

Severity: **P0** blocks crawling or indexing · **P1** high impact · **P2** growth or quality.
Status: ✅ fixed in Phase 1 · ⏭ later phase (planned) · ⚠ needs an owner decision or outside access.

### 3.1 Crawlability, rendering and indexing

| # | Sev | Finding | Evidence | Status |
|---|---|---|---|---|
| C1 | P0 | Product pages are fully client-rendered: the static HTML is a spinner. The description is never shown, and title/description are generic. | `product-details.html`, `product-details.js` `loadProduct()`/`renderProduct()` | ✅ server-rendered |
| C2 | P0 | Listing grid, homepage New Arrivals and categories, navbar and footer are all JS-injected. Static HTML has **no internal links** to products or categories. | `ui.js` `getNavbarHTML`/`getFooterHTML`, `index.html`, `products.html` | ✅ server-rendered, and nav/footer baked into every page at build time |
| C3 | P0 | Category pages canonicalise to `/products`. | `products.html` static `<link rel="canonical">` | ✅ per-URL canonical |
| C4 | P0 | nginx `try_files … /index.html` turns every unknown URL into a 200 homepage. | `frontend/nginx.conf` | ✅ real 404 + branded `404.html` (noindex) |
| C5 | P0 | Unknown, hidden or malformed product ids return 200. The API answers 409 for non-UUIDs. | `product-details.js`, `GlobalExceptionHandler` | ✅ 404 (+ noindex); 503 + `Retry-After` when the API is down |
| C6 | P0 | `.html` → clean URL redirect is absolute `http://` (container is plain HTTP behind TLS), causing a 2-hop chain. | `nginx.conf` `return 301 /$1$2` | ✅ `absolute_redirect off`, single relative hop |
| C7 | P0 | `www.kicksaura.in` serves a duplicate. | curl | ✅ 301 → apex in the container (the host forwards `Host`) |
| C8 | P0 | No robots.txt and no XML sitemap. | curl | ✅ `robots.txt` + dynamic sitemap index |
| C9 | P1 | `/index` duplicate; `/products/` trailing slash returns the homepage. | curl | ✅ 301 → `/` and → `/products` |
| C10 | P1 | Checkout, orders and profile have no noindex. | page heads | ✅ meta robots + `X-Robots-Tag: noindex, follow` |
| C11 | P1 | Admin panel indexable. | `admin/index.html`, `admin/nginx.conf` | ✅ `X-Robots-Tag: noindex, nofollow` + meta robots |
| C12 | P1 | Homepage category cards link `?category=X`; nav links `?categories=X`. Two URLs for one category. | `landing.js` | ✅ one canonical form `?categories=` (legacy form canonicalised) |
| C13 | P1 | Error states would overwrite good content if an API call failed (including inside Google's renderer). | `products.js`, `landing.js`, `product-details.js` | ✅ server-rendered content is kept on fetch errors |
| C14 | P1 | Google verification file not served. | repo root | ✅ moved to `frontend/public/` and excluded from the `.html` redirect |
| C15 | P1 | "View Cart" links to `/cart`, which never existed (it showed the homepage). | `cart-sidebar.js` | ✅ links to `/checkout`; nginx 302 for old links |
| C16 | P1 | Hashed assets uncached and uncompressed. | curl | ✅ `immutable` 1-year cache + gzip for JS/CSS/SVG/JSON/XML |
| C17 | P1 | XSS-prone templates: product names were interpolated into HTML and attributes unescaped (names come from imported supplier data). | `ui.js`, `product-details.js` | ✅ all template output is escaped (shared templates) |
| C18 | P2 | Stray `</div>` in the navbar template (harmless for `innerHTML`, but breaks server-parsed HTML). | navbar template | ✅ fixed (+ regression test) |
| C19 | ⚠ | The host nginx (not in repo) does http→https but sets no HSTS header. | curl | ⚠ needs server access |

### 3.2 On-page (Phase 2)

| # | Sev | Finding | Status |
|---|---|---|---|
| O1 | P1 | Homepage has **no H1** (sections start at H2). | ⏭ Phase 2 |
| O2 | P1 | No meta description on About, Privacy, Refund, Return/Exchange, Shipping, Terms. | ⏭ Phase 2 |
| O3 | P2 | Brand spelled "KicksAura" and "Kicks Aura" across titles. Phase 1 uses "Kicks Aura" for new, server-generated titles. | ⏭ Phase 2 |
| O4 | P2 | No `og:image` on static pages; no Twitter Card tags anywhere. (Phase 1 adds `og:image` on product pages.) | ⏭ Phase 2 |
| O5 | P2 | Hero banners have alt "Kicks Aura Banner 1/2/3" and are `<div data-href>`, not links. | ⏭ Phase 2 |
| O6 | P2 | `/refund-policy` is orphaned (no internal links) and overlaps `/return-exchange`. | ⏭ Phase 2 |
| O7 | P2 | Privacy/Terms force 11–12px text via inline CSS (mobile readability). | ⏭ Phase 2/6 |
| O8 | P2 | The sidebar labels `?trending=true` as "New Arrivals", but the page H1 says "Trending Products" and it holds ≤ 8 items. Phase 1 marks it noindex. | ⏭ Phase 2 |

### 3.3 Catalog content quality (Phases 2–4)

Measured on the full live catalog (2,139 products, 6 Nov 2026):

| Metric | Value |
|---|---|
| Products with an **empty description** | **1,591 (74%)** |
| Products sharing one templated belt sentence ("Classic … belt with a clean, versatile design…") | 303 (193 + 95 + 15). The importer also applies belt text to some sunglasses (`importer/src/content/contentGenerator.js`) |
| Product names duplicated across products | 282 products in 98 name groups |
| Products with brand "Unknown" | ~44% of a 200-product sample |
| Products in deactivated categories still publicly served | 265 (Handbags, Crocs / Flip-Flop). Excluded from the sitemap |
| Out-of-stock products | 37 |
| Product `updatedAt` timestamp | none (only `createdAt`), so the sitemap has no `<lastmod>` yet |
| Genuine reviews or ratings | none. "Reviews" are admin-uploaded images, with no rating and no product link. **No AggregateRating or Review markup may be added.** |

Until descriptions exist, Phase 1 product meta descriptions are built only from real fields (name, category, price, and the site's own COD policy).

### 3.4 Structured data, URLs, performance (later phases)

| # | Finding | Status |
|---|---|---|
| S1 | No JSON-LD anywhere (Organization, WebSite, Product/Offer, BreadcrumbList). | ⏭ Phase 4 |
| U1 | Product URLs are `/product-details?id=<uuid>`; category URLs are query strings. There are slugs on Category/Brand in the database, but none on Product. | ⏭ Phase 4 (slugs + 301s) |
| U2 | No breadcrumbs; no crawlable pagination (View More is JS-only). The sitemap covers discovery meanwhile. | ⏭ Phase 4/5 |
| P1 | Full-screen preloader overlay until `window.load` on home/listing/checkout/orders/profile (hurts FCP/LCP). | ⏭ Phase 6 |
| P2 | Render-blocking `hls.js` from jsDelivr in the product page `<head>`. | ⏭ Phase 6 |
| P3 | Bunny CDN images are served without resizing or format negotiation (Cloudinary/ImageKit URLs get transforms; Bunny gets none). No `width`/`height` or `srcset` anywhere. | ⏭ Phase 6 |
| P4 | `public/logos/headlogo.png` is 604 KB and unused. | ⏭ Phase 6 |
| P5 | Large inline `<style>` blocks (orders 800+ lines, profile 500+, index 280+). | ⏭ Phase 6 |

### 3.5 Owner decisions needed before Phase 4 ⚠

- **Brand attribution and product authenticity.** Product names use third-party trademarks (Nike, Adidas, Gucci, Louis Vuitton, Fendi…). The About page advertises "Top-shelf quality (7A)", and products carry a `withOgBox` flag. Google's Product structured-data and Merchant/Shopping policies prohibit counterfeit or replica goods, and marking items with the trademark owner as `brand` misrepresents them. Phase 1 adds **no** brand claims; Product markup in Phase 4 depends on your answer.
- **Pricing display.** `basePrice` acts as an MRP (e.g. ₹18,889 vs. selling price ₹2,598). Google's price policies require any compared price to be a genuine former or reference price. Confirm before it is used in Offer markup.

### 3.6 Security issues found while auditing (outside SEO scope, not changed)

| Issue | Where |
|---|---|
| `PATCH /api/v1/orders/admin/{id}/status` is **not protected** by the gateway (path is under `/orders/`, not `/admin`). Anyone could change an order's status. | `OrderController.java`, `AuthenticationFilter.isSecured` |
| A JWT signing secret is hard-coded in git; rotate it if it was ever used in production. | `mark_sneakers_new_arrival.py:6` |
| A client-sent `X-User-Id` header passes through on requests without a token. | `AuthenticationFilter.java` |
| The public product API exposes supplier fields (`sourceSite`, `sourceProductId`, `searchText`). Phase 1 strips these from server-rendered HTML, but the API still returns them. | `ProductService` DTO mapping |

---

## 4. What Phase 1 changed

### 4.1 Architecture

```
browser / Googlebot
  → host nginx (TLS)                         [unchanged, not in repo]
  → frontend container (nginx)               [frontend/nginx.conf]
       /, /products, /product-details, /sitemap*.xml ─► SSR renderer (Node, same container, 127.0.0.1:3000)
       │       on 502/504 (renderer down or slow) ─► static page, exactly as before
       /api/  ─► api-gateway                [unchanged]
       everything else ─► static files, real 404 otherwise
SSR renderer ─► http://api-gateway:8080/api/v1 (public GET endpoints only, 3–10 min in-memory cache)
```

- **Everyone gets the same HTML**: no user-agent sniffing, cloaking or dynamic rendering. The page's existing JavaScript still runs and takes over exactly as before.
- **Identical markup.** Server and browser use the same DOM-free template functions (`frontend/src/js/shared/`), so the server HTML is what the client would render. No design change, and no layout shift when the client re-renders.
- **Zero new dependencies**: Node built-ins only. No changes to `docker-compose.yml` services, `deploy.yml` or the host nginx.

### 4.2 Per-URL behaviour

| URL | Status | Robots | Canonical | Server-rendered content |
|---|---|---|---|---|
| `/` | 200 | index | `https://kicksaura.in/` | 16 New Arrivals, 8 category cards, nav (with category links), footer |
| `/products` | 200 | index | `/products` | First batch of product cards |
| `/products?categories=<active category>` (any case; legacy `?category=` too) | 200 | index | `/products?categories=<DB name>` (`%20`-encoded, tracking params dropped) | H1, filter chip, product cards (all 236 Sneakers; 16 for other categories, matching the client) |
| `/products?search=…`, price/brand filters, multiple categories, `trending=true`, deactivated category | 200 | **noindex, follow** (+ header) | none | nav/footer only |
| `/product-details?id=<uuid>` | 200 | index | lower-cased id, all other params dropped | Full product markup (gallery, H1, price, sizes, stock), title `"<name> \| Kicks Aura"`, factual description, OG tags with product image; product JSON embedded so the browser skips a second API call |
| `/product-details?id=<unknown/hidden/invalid>` | **404** | noindex | — | branded 404 page |
| `/product-details` (no id) | 301 → `/products` | — | — | — |
| API down: product page / category page | **503** + `Retry-After: 120` | — | — | static page (users still get the normal client-rendered experience) |
| About/policy pages | 200 | index | self (static) | content + baked nav/footer |
| `/checkout`, `/orders`, `/profile` | 200 | **noindex, follow** (meta + header) | — | unchanged |
| unknown URL | **404** | noindex | — | branded 404 page |
| `/x.html` | 301 → `/x` (one relative hop, query kept) | | | |
| `/index`, `/index.html` | 301 → `/` | | | |
| `/products/` | 301 → `/products` | | | |
| `www.kicksaura.in/*` | 301 → `https://kicksaura.in/*` | | | |
| `/robots.txt` | 200 text | | | allows all; blocks search/price-filter combinations; declares the sitemap |
| `/sitemap.xml` | 200 XML | | | index → `pages.xml` (8), `categories.xml` (8), `products-1.xml` (1,874 products in active categories) |

### 4.3 Files

**New**
- `frontend/src/js/shared/escape.js`: HTML/attribute escaping, safe JSON embedding
- `frontend/src/js/shared/media.js`: media URL helpers (moved verbatim from `ui.js`)
- `frontend/src/js/shared/templates.js`: product card, navbar, footer, category card, filter chips and product-detail markup, shared by browser and server
- `frontend/src/js/shared/seo.js`: canonical/robots rules, titles, descriptions, head tags
- `frontend/ssr/server.js`, `api.js`, `render.js`, `sitemap.js`, `start.sh`: the renderer
- `frontend/ssr/test/*.test.js`: 38 `node --test` tests, run in the Docker build
- `frontend/404.html`, `frontend/public/robots.txt`, `frontend/.dockerignore`
- `frontend/public/google5feebd35865e4497.html` (moved from repo root)

**Modified**
- `frontend/nginx.conf`: rewritten (canonical host, single-hop normalisation on `$request_uri` with open-redirect guard, real 404s, SSR proxy with static fallback, noindex headers, caching, gzip)
- `frontend/Dockerfile`: runs tests and build; the final image adds `nodejs` + `icu-data-full` and the renderer
- `frontend/vite.config.js`: `404.html` input; build-time navbar/footer injection; dev 404 fallback
- `frontend/package.json`: `test` and `ssr` scripts (no new dependencies)
- `frontend/src/js/ui.js`, `product-details.js`, `products.js`, `landing.js`, `cart-sidebar.js`: use the shared templates; keep server-rendered content; canonical category links; `/cart` → `/checkout`
- 12 page templates: marker regions, noindex on private pages, static canonicals on info pages, no hard-coded `/products` canonical
- `admin/nginx.conf`, `admin/index.html`: noindex
- `docker-compose.yml`: comment only

---

## 5. Verification performed

| Check | Result |
|---|---|
| `npm test` (38 tests: escaping/XSS, `$&` safety, canonical/robots rules, route status codes against a stub API, sitemap XML, template tag balance, en-IN formatting) | **38/38 pass** |
| `vite build` | passes; markers preserved; nav/footer links present in every built page |
| Renderer against the **live** read-only API, curl matrix | product: 200, correct title/canonical/OG, price ₹2,598 / ₹18,889, sizes; uppercase id → lowercase canonical; unknown/invalid id → 404; no id → 301; category pages: 200 with self-canonical and cards (Sneakers 236 cards, 800 KB raw / 38 KB gzip); facets → noindex without canonical; homepage: 16 arrivals + 8 categories |
| Sitemaps (`xmllint --noout`) | all four files valid; 1,874 product URLs (= 2,139 − 265 in deactivated categories) |
| In-app browser, local stack (renderer + static build + live API) | product page renders from embedded data with no console errors; size select, add to cart (badge, toast, localStorage) work; homepage arrivals/categories and category page (H1, chip, cards, View More, sidebar checkbox) work; checkout login gate unchanged; policy pages show nav/footer and canonical; unknown URL shows the branded 404 with HTTP 404 |

**Not yet verified** (needs Docker, or a deploy):
- `nginx -t` on the new `frontend/nginx.conf`, and the full container (nginx + renderer + static fallback when the renderer is stopped).
- Production behaviour behind the host nginx (www redirect, single-hop redirects, gzip and cache headers).
- Lighthouse / PageSpeed before-and-after numbers.
- Google Rich Results / URL Inspection (needs the deployed site).

---

## 6. After deploying (checklist)

1. `curl -sI https://kicksaura.in/products.html` → one `301`, `Location: /products`.
2. `curl -sI https://www.kicksaura.in/` → `301`, `Location: https://kicksaura.in/`.
3. `curl -s https://kicksaura.in/product-details?id=<real id> | grep '<h1'` → the product name in raw HTML.
4. `curl -sI https://kicksaura.in/nope` → `404`. `curl -s https://kicksaura.in/robots.txt` → text.
5. Search Console:
   - submit `https://kicksaura.in/sitemap.xml`
   - URL-inspect one product, one category and the homepage (live test, view rendered HTML)
   - over 2–4 weeks, watch Pages → "Soft 404", "Duplicate, Google chose different canonical" and "Crawled – currently not indexed"
6. Review the Search Console 404 report for any old URLs worth a 301.

---

## 7. Next phases

- **Phase 2:** titles, descriptions and H1s per page; OG/Twitter; brand spelling; hero links/alt; refund/return consolidation.
- **Phase 3:** keyword map (home → brand + primary; categories → commercial; products → exact name/attributes; blog → informational).
- **Phase 4:** Organization/WebSite/Product/Offer/BreadcrumbList JSON-LD (subject to §3.5), slug URLs with 301s, breadcrumbs, related-product links, category copy.
- **Phase 5:** `updatedAt` for sitemap `lastmod`, crawlable pagination.
- **Phase 6:** Core Web Vitals (preloader, hls.js, image sizing/format, fonts, inline CSS).
- **Phases 7–11:** blog, brand SEO, security/indexing review, validation, final report.
