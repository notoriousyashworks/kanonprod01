/* ============================================
   Shared HTML templates — used by the browser bundle AND the Node SSR
   renderer (frontend/ssr), so server-rendered markup is identical to what
   the client renders (no layout shift, no design drift).

   Rules for this module:
   - DOM-free and side-effect free at module scope (no window/document/
     localStorage/import.meta). Runtime config is passed in via `opts`.
   - Every value that comes from the API is escaped.
   ============================================ */
import { escapeHtml, escapeAttr } from './escape.js';
import { formatMediaUrl, formatCardImageUrl, formatCloudinaryUrl, formatVideoPoster, formatVideoHls, formatVideoMp4, formatVideoHoverPreview } from './media.js';

export const DEFAULT_WHATSAPP_NUMBER = '916239379751';

/** URL-safe slug: "Men's Watches" → "men-s-watches"; capped so URLs stay readable. */
export function slugify(text, max = 80) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, max)
    .replace(/^-+|-+$/g, '');
}

/** Canonical listing URL for a category (single source of truth for category links). */
export function categoryHref(name) {
  return `/category/${slugify(name)}`;
}

/**
 * Canonical product URL: /product/<name-slug>-<uuid>. The UUID identifies the
 * product (names can repeat); a stale slug simply 301s to the current one.
 * Without a name it uses the legacy form, which also 301s to the canonical URL.
 */
export function productHref(id, name) {
  const lowerId = String(id).toLowerCase();
  if (name === undefined) return `/product-details?id=${encodeURIComponent(lowerId)}`;
  const slug = slugify(name);
  return `/product/${slug ? `${slug}-` : ''}${encodeURIComponent(lowerId)}`;
}

/** Visible breadcrumb trail. items: [{ name, href? }], last item is the current page. */
export function breadcrumbsHTML(items = []) {
  if (!items.length) return '';
  const parts = items.map((item, i) => (item.href && i < items.length - 1
    ? `<a href="${escapeAttr(item.href)}">${escapeHtml(item.name)}</a>`
    : `<span aria-current="page">${escapeHtml(item.name)}</span>`));
  return `<nav class="ka-breadcrumbs" aria-label="Breadcrumb">${parts.join('<span class="ka-breadcrumbs__sep" aria-hidden="true">/</span>')}</nav>`;
}

/** "View More" as a real link, so further batches are crawlable; JS intercepts the click. */
export function viewMoreHTML(href, { loading = false } = {}) {
  return `
      <div class="products-view-more">
        <a class="products-view-more-btn" href="${escapeAttr(href)}" style="display:inline-block;text-decoration:none;${loading ? 'pointer-events:none;opacity:.7;' : ''}">${loading ? 'Loading...' : 'View More'}</a>
      </div>`;
}

/**
 * Product description safe to show or use in meta tags. Imported products carry
 * template text about belts, some of it wrongly attached to other categories,
 * so that text is ignored outside the Belts category.
 */
export function displayDescription(product) {
  const text = String(product.description || '').trim();
  if (text.length < 40) return '';
  const isBelt = /belt/i.test(String(product.category || ''));
  if (!isBelt && /\bbelts?\b/i.test(text)) return '';
  return text;
}

/** Links rendered inside the desktop "CATEGORIES" dropdown. */
export function categoryLinksHTML(categories = []) {
  return categories.map(c => `
      <a href="${escapeAttr(categoryHref(c.name))}" class="nav-dropdown-link">${escapeHtml(c.name)}</a>
    `).join('');
}

// Create a product card HTML
/**
 * Product card markup (listing grids, new arrivals, related products).
 * @param {object} product  ProductResponseDTO
 * @param {{liked?: boolean, eager?: boolean}} [opts]  liked = wishlist state (client only);
 *   eager = above-the-fold card (first row), loaded immediately rather than lazily
 */
export function productCardHTML(product, { liked = false, eager = false } = {}) {
  // formatMediaUrl handles both Cloudinary and ImageKit URLs transparently.
  // Existing Cloudinary URLs continue using Cloudinary transforms internally.
  const image = formatCardImageUrl(product.imageUrls?.[0] || '');
  const hasVideo = product.videoUrls?.length > 0;
  const firstVideo = hasVideo ? product.videoUrls[0] : null;

  const fmtPrice = (p) => p != null ? '₹' + p.toLocaleString('en-IN') : '';
  const currentPrice = product.discountedPrice || product.basePrice;
  const originalPrice = product.discountedPrice ? product.basePrice : null;
  const isLiked = liked;
  const id = escapeAttr(product.id);
  const name = escapeHtml(product.name || '');

  let mediaHTML = '';
  if (image) {
    mediaHTML = `<img src="${escapeAttr(image)}" alt="${name}" width="400" height="432" loading="${eager ? 'eager' : 'lazy'}" decoding="async" />`;
  } else if (firstVideo) {
    mediaHTML = `<video 
      poster="${escapeAttr(formatVideoPoster(firstVideo))}"
      data-src="${escapeAttr(formatVideoHoverPreview(firstVideo))}"
      class="pc-video-preview" 
      muted playsinline loop 
      onmouseover="if (!this.src && this.dataset.src) { this.src = this.dataset.src; } this.play();" 
      onmouseout="this.pause()" 
      style="width:100%; height:100%; object-fit:contain; background:transparent;">
    </video>`;
  } else {
    mediaHTML = `<div class="pc-no-image">👟</div>`;
  }

  const badgesContainer = '';

  const isHandbag = (product.category || '').trim().toLowerCase() === 'handbags';
  // Handle stock flag (defaults to in-stock if true or missing)
  const isOutOfStock = product.inStockFlag === false;

  const soldOutOverlay = isOutOfStock ? `
    <div class="pc-sold-out-overlay">
      <span class="pc-sold-out-label">SOLD OUT</span>
    </div>
  ` : '';

  return `
    <a href="${escapeAttr(productHref(product.id, product.name || ''))}" class="product-card-link" aria-label="${name}">
      <article class="product-card product-card-new ${isHandbag ? 'is-handbag' : ''} ${isOutOfStock ? 'is-sold-out' : ''}" data-product-id="${id}">
        <div class="pc-image-wrap">
          ${badgesContainer}
          <button class="pc-heart-btn ${isLiked ? 'active' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleWishlistItem('${id}'); this.classList.toggle('active'); this.querySelector('svg').setAttribute('fill', this.classList.contains('active') ? '#c82333' : 'none'); this.querySelector('svg').setAttribute('stroke', this.classList.contains('active') ? '#c82333' : 'currentColor')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? '#c82333' : 'none'}" stroke="${isLiked ? '#c82333' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="pc-whatsapp-btn" aria-label="Contact on WhatsApp" data-product-id="${id}" data-product-name="${name}" onclick="event.preventDefault(); event.stopPropagation(); window.openProductWhatsApp(this.dataset.productName, this.dataset.productId)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
            </svg>
          </button>
          ${mediaHTML}
          ${soldOutOverlay}
        </div>
        <div class="pc-body">
          ${product.category ? `<div class="pc-category">${escapeHtml(product.category)}</div>` : ''}
          <h3 class="pc-name">${name}</h3>
          <div class="pc-price-row">
            <span class="pc-price ${originalPrice ? 'pc-price--sale' : 'pc-price--normal'}">${fmtPrice(currentPrice)}</span>
            ${originalPrice ? `<span class="pc-original-price">${fmtPrice(originalPrice)}</span>` : ''}
          </div>
        </div>
      </article>
    </a>
  `;
}

/**
 * Navbar + wishlist/cart sidebars markup.
 * @param {string} activePage
 * @param {{categories?: Array<{name: string}>}} [opts]  when given (SSR), the
 *   CATEGORIES dropdown is pre-filled so its links are crawlable without JS.
 */
export function navbarHTML(activePage = 'home', { categories } = {}) {
  return `
    <header class="header">
      <!-- Top Bar: Logo, Search, Icons -->
      <div class="header__top" style="background-color: #000000; border-bottom: none;">
        <div class="container header__top-inner">
          <!-- Hamburger + Home (mobile only) -->
          <div class="mobile-left-actions">
            <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-expanded="false" style="color: #fff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <a href="/" class="icon-btn mobile-home-btn" aria-label="Home" style="color: #fff;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </a>
          </div>
          
          <a href="/" class="header__logo">
            <div class="header__logo-text-wrapper">
              <div class="header__logo-brand">
                <span class="brand-kicks">Kicks</span><span class="brand-aura">Aura</span>
              </div>
              <div class="header__logo-sub">
                <span>PREMIUM</span> <span class="sub-divider">|</span> <span class="sub-highlight">UNISEX</span> <span class="sub-divider">|</span> <span>CURATED</span>
              </div>
            </div>
          </a>
          <div class="header__search">
            <div class="header__search-icon-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input type="text" placeholder="" id="nav-search-input" />
            <div class="animated-placeholder-wrapper" id="nav-animated-placeholder">
              <span class="animated-placeholder-text visible" id="placeholder-text-1">Search for Sneakers...</span>
              <span class="animated-placeholder-text slide-down" id="placeholder-text-2"></span>
            </div>
            <button class="header__search-btn" id="nav-search-btn" style="display:none;"></button>
          </div>
          <div class="header__icons">
            <button class="icon-btn nav-icon" id="wishlist-trigger" aria-label="Wishlist" style="position: relative; background:none; border:none; cursor:pointer; color: #fff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="cart-badge nav-badge" id="wishlist-badge" style="display: none;">0</span>
            </button>
            <button class="icon-btn" id="cart-trigger" style="position: relative; background:none; border:none; cursor:pointer; color: #fff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span class="cart-badge navbar__cart-count" id="cart-badge">0</span>
            </button>
            <div class="profile-dropdown-wrap" id="profile-dropdown-wrap">
              <button class="icon-btn profile-icon-btn" id="profile-icon-btn" aria-label="Account" aria-haspopup="true" style="color: #fff;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              <div class="profile-dropdown" id="profile-dropdown" role="menu">
                <div class="profile-dropdown-header" id="profile-dropdown-header" style="padding: 16px 20px 12px; border-bottom: none;">
                  <h3 class="profile-dropdown-label" style="font-size: 16px; color: #111; font-weight: 700; text-transform: none; letter-spacing: 0; margin: 0;">Account</h3>
                  <p class="profile-dropdown-name" id="profile-dropdown-name" style="display:none;"></p>
                </div>
                <div class="profile-dropdown-auth" id="profile-dropdown-auth" style="display:flex; flex-direction:column; gap:10px; padding:0 20px 16px;">
                  <button class="profile-auth-btn" id="profile-login-btn" style="background:#315bfb; color:#fff; border-radius:10px; padding:12px; font-size:14px; font-weight:600; border:none; cursor:pointer; width: 100%;">Log In with Mobile</button>
                </div>
                <div class="profile-dropdown-actions" style="border-top:none; padding: 0 20px 20px;">
                  <a href="/orders" class="profile-dropdown-btn" id="profile-dd-orders">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Orders
                  </a>
                  <a href="/profile" class="profile-dropdown-btn" id="profile-dd-profile">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </a>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      
      <!-- Nav Links -->
      <nav class="header__nav">
        <div class="header__nav-inner desktop-nav-centered">
          <a href="/" class="nav-link ${activePage === 'home' ? 'nav-link--active' : ''}">HOME</a>
          <div class="nav-item-dropdown">
            <a href="/#shop-category" class="nav-link ${activePage === 'products' ? 'nav-link--active' : ''}">
              CATEGORIES
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l4 4 4-4"/></svg>
            </a>
            <div class="nav-dropdown-content" id="desktop-nav-categories">
              ${categories && categories.length ? categoryLinksHTML(categories) : '<!-- Categories injected via JS -->'}
            </div>
          </div>
          <a href="/new-arrivals" class="nav-link">NEW ARRIVALS</a>
          <a href="/shipping-policy" class="nav-link ${activePage === 'shipping' ? 'nav-link--active' : ''}">SHIPPING POLICY</a>
        </div>
      </nav>

      <!-- Mobile Nav Drawer -->
      <div class="mobile-nav-overlay" id="mobile-nav-overlay" aria-hidden="true"></div>
      <div class="mobile-nav-drawer" id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div class="mobile-nav-drawer__header" style="justify-content: flex-end;">
          <button class="mobile-nav-drawer__close" id="mobile-nav-close" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <nav class="mobile-nav-drawer__nav">
          <a href="/" class="mobile-nav-link ${activePage === 'home' ? 'mobile-nav-link--active' : ''}">
            Home
          </a>
          <a href="/#shop-category" class="mobile-nav-link ${activePage === 'products' ? 'mobile-nav-link--active' : ''}">
            Categories
          </a>
          <a href="/new-arrivals" class="mobile-nav-link">
            New Arrivals
          </a>
          <a href="/shipping-policy" class="mobile-nav-link ${activePage === 'shipping' ? 'mobile-nav-link--active' : ''}">
            Shipping Policy
          </a>
        </nav>
        <div class="mobile-nav-drawer__footer">
          <span>© 2026 Kicks Aura. All rights reserved.</span>
        </div>
      </div>

    <div class="header__promo-bar">
      <div class="promo-slide promo-slide-1">
        <strong>Extra Rs 200 Off</strong> <span class="promo-subtext">on Prepaid Orders</span>
      </div>
      <div class="promo-slide promo-slide-2">
        <strong>COD Available</strong> <span class="promo-subtext">(₹ 99 Advance)</span>
      </div>
    </div>
    </header>
  
    <!-- Wishlist Sidebar -->
    <div class="sidebar-overlay" id="wishlist-overlay"></div>
    <div class="sidebar cart-sidebar-modern" id="wishlist-sidebar">
      <div class="sidebar-header">
        <h3>Your Wishlist</h3>
        <button class="close-sidebar" id="close-wishlist">✕</button>
      </div>
      <div class="wishlist-items" id="wishlist-items-container">
        <!-- Items injected via JS -->
      </div>
    </div>

    <!-- Cart Sidebar -->
    <div class="sidebar-overlay" id="cart-overlay"></div>
    <div class="sidebar cart-sidebar-modern" id="cart-sidebar">
      <div class="sidebar-header cart-header-modern">
        <h3 class="cart-main-title">Your Cart <span class="cart-sidebar-count" id="cart-sidebar-count"></span></h3>
        <button class="close-sidebar" id="close-cart" aria-label="Close cart">✕</button>
      </div>
      <div class="cart-shipping-banner" id="cart-shipping-banner">
        <!-- Free shipping progress bar injected via JS -->
      </div>
      <div class="cart-sidebar-items" id="cart-sidebar-items">
        <!-- Items injected via JS -->
      </div>
      <div class="cart-sidebar-footer" id="cart-sidebar-footer">
        <!-- Footer injected via JS -->
      </div>
    </div>
  `;
}

/**
 * Footer markup.
 */
export function footerHTML() {
  return `
    <footer id="footer" class="footer">
      <div class="footer__features">
        <div class="footer__feature">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h5>COD AVAILABLE</h5>
          <p>(Only Rs 99 advance)</p>
        </div>
        <div class="footer__feature">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          <h5>RS 200 OFF ON PREPAID</h5>
          <p>Shipping</p>
        </div>
        <div class="footer__feature">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          <h5>EASY RETURNS & EXCHANGE</h5>
          <p>Hassle-free within 7 days</p>
        </div>
      </div>
      
      <div class="footer__main">
        <div class="footer__col footer__col--contact">
          <h4>CUSTOMER CARE</h4>
          <p><span>Address:</span> Phase 2, Chandigarh, India</p>
          <p><span>Mobile:</span> +91 6239379751</p>
          <p><span>Email:</span> kicksauraa@gmail.com</p>
          <p><span>Store Time:</span> 11:00 AM - 8:00 PM, Monday - Saturday</p>
        </div>
        
        <div class="footer__col footer__col--links-wrapper">
          <div class="footer__links-col">
            <a href="/">Home</a>
            <a href="/products">All Products</a>
            <a href="/new-arrivals">New Arrivals</a>
            <a href="/blog">Blog</a>
            <a href="/about-us">About Us</a>
            <a href="/contact-us">Contact Us</a>
          </div>
          <div class="footer__links-col">
            <a href="/shipping-policy">Shipping & Delivery Policy</a>
            <a href="/return-exchange">Return & Exchange</a>
            <a href="/refund-policy">Refund Policy</a>
            <a href="/terms-conditions">Terms & Conditions</a>
            <a href="/privacy-policy">Privacy Policy</a>
          </div>
        </div>
        
        <div class="footer__col footer__col--social">
          <a href="https://instagram.com/kicksauraa" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
      </div>

      <div class="footer__bottom">
        <p>© 2026 Kicks Aura. All rights reserved.</p>
      </div>
    </footer>
  `;
}

/** "You May Also Like" section (server-rendered; the browser refreshes it with its own picks). */
export function relatedSectionHTML(products = []) {
  return `
    <section id="related-products-section" class="related-products-section">
      <div class="related-products-inner">
        <h2 class="related-products-title">You May Also Like</h2>
        <div class="related-products-grid" id="related-products-grid">
          ${products.map(p => productCardHTML(p)).join('')}
        </div>
      </div>
    </section>`;
}

/** Active filter chips row on /products (labels are escaped). */
export function activeChipsHTML(labels = []) {
  return labels
    .map(
      (label, i) => `
      <button class="filter-chip filter-chip--active" data-chip-index="${i}">
        ${escapeHtml(label)}
        <span class="filter-chip__remove">✕</span>
      </button>`
    )
    .join('');
}

/** Category card markup (homepage "SHOP BY CATEGORY" grid). */
export function categoryCardHTML(cat) {
  return `
      <a href="${escapeAttr(categoryHref(cat.name))}" class="category-card">
        <div class="category-image-wrap">
          ${cat.imageUrl
            ? `<img src="${escapeAttr(formatCloudinaryUrl(cat.imageUrl))}" alt="${escapeAttr(cat.name)}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#aaa;font-size:13px;">No image</div>`}
        </div>
        <div class="category-name">${escapeHtml(cat.name)}</div>
      </a>`;
}

const fmtPrice = (p) => p != null ? '₹' + p.toLocaleString('en-IN') : '';

/**
 * Derived values for the product detail page, shared by the markup builder and
 * the client-side interaction code (gallery, size selection, cart).
 */
export function buildProductView(product) {
  // formatMediaUrl routes Cloudinary URLs through Cloudinary transforms and
  // ImageKit URLs through ImageKit transforms transparently.
  const images = (product.imageUrls?.length > 0 ? product.imageUrls : []).map(formatMediaUrl);
  // Show all videos — videoVisible is an admin badge flag, not a storefront visibility gate
  const videos = product.videoUrls?.length > 0 ? product.videoUrls : [];
  const mediaItems = [
    ...images.map(url => ({ type: 'image', url })),
    ...videos.map(url => ({ type: 'video', url }))
  ];

  const currentPrice = product.discountedPrice || product.basePrice;
  const originalPrice = product.discountedPrice ? product.basePrice : null;
  const discountPct = originalPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
  const hasVariants = !!(product.variants && product.variants.length > 0);

  return { images, videos, mediaItems, currentPrice, originalPrice, discountPct, hasVariants };
}

/**
 * Main product detail markup (gallery + details column) rendered into
 * #product-container — by product-details.js in the browser and by the SSR
 * renderer on the server.
 * @param {object} product  ProductResponseDTO
 * @param {object} [view]   buildProductView(product)
 * @param {{liked?: boolean, whatsappNumber?: string, origin?: string}} [opts]
 */
export function productDetailHTML(product, view = buildProductView(product), { liked = false, whatsappNumber, origin = 'https://kicksaura.in' } = {}) {
  const description = displayDescription(product);
  const { images, mediaItems, currentPrice, originalPrice, discountPct, hasVariants } = view;
  const name = escapeHtml(product.name || '');

  // Thumbnails HTML — vertical strip
  // Video thumbnails: use the primary product image as a cover, overlaid with a play icon
  const thumbnailsHTML = mediaItems.map((item, i) => {
    if (item.type === 'video') {
      const coverImage = formatVideoPoster(item.url) || images[0] || '';
      return `
        <div class="thumb-item thumb-video ${i === 0 ? 'active' : ''}" data-idx="${i}" title="Watch video">
          <div class="thumb-video-placeholder">
            <img src="${escapeAttr(coverImage)}" loading="lazy" alt="${name} video" />
            <div class="thumb-video-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
        </div>`;
    } else {
      // First image: eager (already in viewport). Rest: lazy.
      return `
        <div class="thumb-item ${i === 0 ? 'active' : ''}" data-idx="${i}">
          <img src="${escapeAttr(item.url)}" alt="${name} ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" />
        </div>`;
    }
  }).join('');

  function getMainMediaHTML(isLiked) {
    const wishlistBtn = `
      <button class="wishlist-btn-detail ${isLiked ? 'active' : ''}" id="wishlist-detail-btn" aria-label="Add to wishlist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? '#c82333' : 'none'}" stroke="${isLiked ? '#c82333' : 'currentColor'}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>`;
    const expandBtn = `
      <button class="expand-btn" id="expand-btn" aria-label="View larger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>`;

    if (!mediaItems || mediaItems.length === 0) {
      return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;background:transparent;">👟</div>` + wishlistBtn;
    }
    // Main slides:
    // - Images: first slide gets src immediately (eager). Others use data-src (lazy loaded on demand).
    // - Videos: preload="none" + src only injected when activated — saves huge bandwidth.
    const slidesHTML = mediaItems.map((item, idx) => `
      <div class="main-media-slide" data-idx="${idx}" style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${item.type === 'video'
        ? `<video
               class="ka-lazy-video"
               id="main-video-${idx}"
               poster="${escapeAttr(formatVideoPoster(item.url) || '')}"
               data-hls-src="${escapeAttr(formatVideoHls(item.url) || '')}"
               data-mp4-src="${escapeAttr(formatVideoMp4(item.url) || '')}"
               controls
               controlsList="nodownload noplaybackrate"
               disablePictureInPicture
               preload="metadata"
               playsinline
               onclick="window.initVideoPlayback(this, false)"
               style="cursor:pointer; width:100%; height:100%; object-fit:contain; background:transparent;"
             ></video>
             <button class="center-play-btn" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
             </button>`
        : `<img
               ${idx === 0 ? `src="${escapeAttr(item.url)}"` : `data-src="${escapeAttr(item.url)}"`}
               alt="${name}"
               id="main-image-${idx}"
               loading="${idx === 0 ? 'eager' : 'lazy'}"
               ${idx === 0 ? 'fetchpriority="high"' : ''}
               decoding="async"
               style="width:100%; max-width:100%; height:100%; max-height:100%; object-fit:contain; background:transparent; display:block;"
             />`
      }
      </div>
    `).join('');
    return `
      <div class="main-media-track" id="main-media-track">
        ${slidesHTML}
      </div>
      ${wishlistBtn}
      ${expandBtn}
    `;
  }

  const sortedVariants = hasVariants
    ? [...product.variants].sort((a, b) => {
        const aNum = parseFloat((String(a.size || '')).replace(/[^0-9.]/g, '')) || 0;
        const bNum = parseFloat((String(b.size || '')).replace(/[^0-9.]/g, '')) || 0;
        return aNum - bNum;
      })
    : [];

  const variantsHTML = hasVariants
    ? sortedVariants.map(v => `
        <button class="size-btn ${v.stockQuantity <= 0 ? 'size-btn--oos' : ''}"
          data-variant-id="${escapeAttr(v.id)}"
          data-stock="${escapeAttr(v.stockQuantity)}"
          ${v.stockQuantity <= 0 ? 'disabled title="Out of stock"' : ''}> 
          ${escapeHtml(v.size)}
        </button>`).join('')
    : '';
  const sizeChooserHTML = hasVariants ? `
      <div style="margin-bottom: 26px;">
        <button id="size-chart-btn" style="background: none; border: none; padding: 0; color: #000; text-decoration: underline; cursor: pointer; font-size: 14.5px; font-weight: 400; font-family: inherit;">Size Chart</button>
      </div>

      <div class="size-section">
        <p class="size-label">Select Size</p>
        <div class="size-options" id="size-options">
          ${variantsHTML}
        </div>
      </div>` : '';

  const whatsappUrl = `https://wa.me/${whatsappNumber || DEFAULT_WHATSAPP_NUMBER}?text=${encodeURIComponent('I am interested in ' + product.name + ' - ' + origin + productHref(product.id, product.name || ''))}`;

  return `
    <!-- Left: Gallery -->
    <div class="product-gallery">
      <div class="gallery-inner">
        <!-- Vertical thumbnails strip -->
        ${mediaItems.length > 1 ? `
        <div class="thumb-strip" id="thumb-strip">
          ${thumbnailsHTML}
        </div>` : ''}
        <!-- Main image -->
        <div class="main-image-container" id="main-media-wrap">
          ${getMainMediaHTML(liked)}
        </div>
      </div>
    </div>

    <!-- Right: Details -->
    <div class="product-details">
      <h1 class="product-title pd-title-modern">${name}</h1>
      
      <div class="pd-pricing-section">
        <div class="pd-curr-price">${fmtPrice(currentPrice)}</div>
        ${originalPrice && discountPct > 0 ? `<div class="pd-orig-price">${fmtPrice(originalPrice)}</div>` : ''}
      </div>
      
      <p class="pd-shipping-link"><a href="/shipping-policy" class="pd-open-shipping-modal" style="color: #2563eb; text-decoration: underline; cursor: pointer;">Shipping</a> calculated at checkout.</p>
      
      <a href="${escapeAttr(whatsappUrl)}" target="_blank" rel="noopener noreferrer" class="pd-whatsapp-inquiry-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        WhatsApp Inquiry
      </a>

      ${product.withOgBox ? `
      <div class="pd-og-box-row" style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 22px; display: flex; align-items: center; justify-content: center;">
          📦
        </div>
        <span style="font-size: 15px; font-weight: 600; color: #111;">With OG Box</span>
      </div>
      ` : ''}

      ${product.inStockFlag === false ? '' : `
      ${sizeChooserHTML}

      <div class="quantity-section">
        <p class="quantity-label">Quantity</p>
        <div class="quantity-stepper" id="quantity-stepper">
          <button class="qty-btn qty-btn--minus" id="qty-minus" aria-label="Decrease quantity">−</button>
          <span class="qty-value" id="qty-value">1</span>
          <button class="qty-btn qty-btn--plus" id="qty-plus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <div id="live-video-option-box" style="margin: 20px 0 22px; padding: 14px 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; display: flex; align-items: flex-start; gap: 12px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <input type="checkbox" id="live-video-check" checked style="margin-top: 2px; width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer; flex-shrink: 0;" />
        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
          <label for="live-video-check" style="font-size: 14.5px; font-weight: 700; color: #1e293b; cursor: pointer; margin: 0; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span>📹 Live video call before dispatch</span>
            </span>
          </label>
          <span style="font-size: 12.5px; color: #64748b; line-height: 1.4; cursor: pointer;">Get a 1-on-1 live video call with our team to verify quality right before dispatch.</span>
        </div>
      </div>
      `}

      ${product.inStockFlag === false ? `
      <div class="action-row" style="display:flex;width:100%;">
        <button class="btn-out-of-stock" disabled style="flex:1;background:#e2e8f0;color:#64748b;font-weight:700;font-size:15px;letter-spacing:1px;border:none;border-radius:30px;padding:16px;cursor:not-allowed;">OUT OF STOCK</button>
      </div>
      ` : `
      <div class="action-row">
        <button class="btn-add-to-cart" id="add-to-cart-btn">ADD TO CART</button>
        <button class="btn-buy-now" id="buy-now-btn">BUY NOW</button>
      </div>
      `}
      <div style="text-align: left; margin-top: -12px; margin-bottom: 32px; padding-left: 2px;">
        <span style="font-size: 14px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Guaranteed Safe Checkout
        </span>
      </div>

      <section class="pd-info" aria-label="Product information">
        ${description ? `<p class="pd-info__description">${escapeHtml(description)}</p>` : ''}
        <ul class="pd-info__list">
          ${product.category ? `<li><strong>Category:</strong> ${escapeHtml(product.category)}</li>` : ''}
          <li><strong>Delivery:</strong> 4–5 working days across India. See our <a href="/shipping-policy">shipping policy</a>.</li>
          <li><strong>Payment:</strong> Prepaid or cash on delivery (₹99 advance per product).</li>
          <li><strong>Returns:</strong> See our <a href="/return-exchange">return and exchange policy</a>.</li>
        </ul>
      </section>

    </div>
  `;
}
