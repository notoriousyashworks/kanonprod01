/* ============================================
   KicksAura UI Utilities
   ============================================ */
import { isWishlisted, toggleWishlistItem } from './wishlist.js';
import { initLoginModalTrigger } from './login-modal.js';
import { getAllProducts } from './api.js';

// Toast notifications
export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Prevent duplicate toasts for the same message
  const existingToasts = container.querySelectorAll('.toast');
  for (let t of existingToasts) {
    if (t.textContent === message) {
      return; // Already showing this message
    }
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function initSearch() {
  const searchInput = document.getElementById('nav-search-input');
  const searchBtn = document.getElementById('nav-search-btn');

  const executeSearch = () => {
    if (searchInput && searchInput.value.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  };

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', executeSearch);
  }

  // --- Animated Placeholder Logic ---
  const placeholderWrapper = document.getElementById('nav-animated-placeholder');
  const text1 = document.getElementById('placeholder-text-1');
  const text2 = document.getElementById('placeholder-text-2');

  if (searchInput && placeholderWrapper && text1 && text2) {
    const phrases = [
      "Search for Sneakers...",
      "Search for Apparel...",
      "Search for Perfumes...",
      "Search for Watches...",
      "Search for Nike Pandas...",
      "Search for Adidas Sambas...",
      "Search for New Balance 9060...",
      "Search for Air Force 1...",
      "Search for Onitsuka Tiger...",
      "Search for Air Jordan 1...",
      "Search for Sunglasses...",
      "Search for Nike Dunks...",
      "Search for Adidas Campus...",
      "Search for Belts...",
      "Search for New Balance 530...",
      "Search for Air Jordan 4...",
      "Search for Adidas Spezial...",
      "Search for Nike Vomero...",
      "Search for Wallets...",
      "Search for ASICS Gel-NYC...",
      "Search for Nike P-6000...",
      "Search for New Balance 550...",
      "Search for Travis Scott...",
      "Search for Accessories...",
      "Search for Yeezy 350..."
    ];

    let currentIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId = null;

    const typeWriter = () => {
      const currentPhrase = phrases[currentIndex];

      if (isDeleting) {
        text1.textContent = currentPhrase.substring(0, currentCharIndex - 1);
        currentCharIndex--;
      } else {
        text1.textContent = currentPhrase.substring(0, currentCharIndex + 1);
        currentCharIndex++;
      }

      let typingSpeed = isDeleting ? 30 : 60; // Deleting is faster than typing

      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        // Pause at the end of typing before deleting
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        // Switch to next phrase and pause before starting to type
        isDeleting = false;
        currentIndex = (currentIndex + 1) % phrases.length;
        typingSpeed = 500;
      }

      timeoutId = setTimeout(typeWriter, typingSpeed);
    };

    const startAnimation = () => {
      if (timeoutId) return;

      // Make sure the second text is hidden as we don't need it for typewriter
      if (text2) text2.style.display = 'none';
      text1.className = 'animated-placeholder-text visible';

      timeoutId = setTimeout(typeWriter, 500);
    };

    const stopAnimation = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const updateVisibility = () => {
      if (document.activeElement === searchInput || searchInput.value.trim() !== '') {
        placeholderWrapper.style.display = 'none';
        stopAnimation();
      } else {
        placeholderWrapper.style.display = 'flex';
        startAnimation();
      }
    };

    searchInput.addEventListener('focus', updateVisibility);
    searchInput.addEventListener('blur', updateVisibility);
    searchInput.addEventListener('input', updateVisibility);

    // Initial check
    updateVisibility();
  }
}

// Format price as INR
export function formatPrice(price) {
  if (price == null) return '';
  return '₹ ' + price.toLocaleString('en-IN');
}

export function formatCloudinaryUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/') && !url.includes('/f_auto')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
  }
  return url;
}

export function formatCloudinaryVideoPoster(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/so_0,w_800,q_auto/f_jpg/');
}

export function formatCloudinaryVideoHls(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/sp_auto:maxres_720p/').replace(/\.mp4$/i, '.m3u8');
}

export function formatCloudinaryVideoMp4(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,vc_h264,w_800/');
}

export function formatCloudinaryHoverPreview(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,vc_h264,w_400/');
}

// ── ImageKit Helpers ──────────────────────────────────────────────────────
// These do NOT affect Cloudinary URLs. All formatCloudinary* functions above
// are completely unchanged and continue working for existing products.

/** True if the URL is an ImageKit delivery URL. */
function isImageKitUrl(url) {
  return typeof url === 'string' && url.includes('ik.imagekit.io');
}

/** ImageKit image with auto quality + format (tr=q-auto,f-auto,w-800). */
export function formatImageKitUrl(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=q-auto,f-auto,w-800';
}

/** ImageKit video poster — first frame as JPEG (tr=so-0,f-jpg,w-800,q-auto). */
export function formatImageKitVideoPoster(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=so-0,f-jpg,w-800,q-auto';
}

/**
 * ImageKit optimised MP4 delivery (tr=f-mp4,q-auto).
 * Note: HLS/ABR streaming requires the ImageKit Adaptive Bitrate add-on.
 * Plain MP4 is used here so it works on all ImageKit plans.
 */
export function formatImageKitVideoMp4(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=f-mp4,q-auto';
}

/** ImageKit hover-preview video (low-width for product cards). */
export function formatImageKitHoverPreview(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=f-mp4,q-auto,w-400';
}

// ── Provider-agnostic Dispatch Functions ────────────────────────────────
// Use these in new code so Cloudinary and ImageKit URLs both work.

/** Optimise an image URL regardless of CDN provider. */
export function formatMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryUrl(url);
  if (isImageKitUrl(url)) return formatImageKitUrl(url);
  return url;
}

/** Video poster — routes to the correct provider's still-frame function. */
export function formatVideoPoster(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryVideoPoster(url);
  if (isImageKitUrl(url)) return formatImageKitVideoPoster(url);
  return url;
}

/**
 * Video HLS URL — routes to provider.
 * ImageKit: returns raw URL (HLS needs ABR add-on; MP4 is the reliable fallback).
 */
export function formatVideoHls(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryVideoHls(url);
  if (isImageKitUrl(url)) return url; // raw URL; HLS.js will fail gracefully → MP4 fallback
  return url;
}

/** Optimised MP4 — routes to the correct provider. */
export function formatVideoMp4(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryVideoMp4(url);
  if (isImageKitUrl(url)) return formatImageKitVideoMp4(url);
  return url;
}

/** Low-res hover-preview video — routes to the correct provider. */
export function formatVideoHoverPreview(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryHoverPreview(url);
  if (isImageKitUrl(url)) return formatImageKitHoverPreview(url);
  return url;
}

// Create a product card HTML
export function createProductCard(product) {
  // formatMediaUrl handles both Cloudinary and ImageKit URLs transparently.
  // Existing Cloudinary URLs continue using Cloudinary transforms internally.
  const image = formatMediaUrl(product.imageUrls?.[0] || '');
  const hasVideo = product.videoUrls?.length > 0;
  const firstVideo = hasVideo ? product.videoUrls[0] : null;

  const fmtPrice = (p) => '₹' + p.toLocaleString('en-IN');
  const currentPrice = product.discountedPrice || product.basePrice;
  const originalPrice = product.discountedPrice ? product.basePrice : null;
  const discountPct = originalPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
  const isLiked = isWishlisted(product.id);

  let mediaHTML = '';
  if (image) {
    mediaHTML = `<img src="${image}" alt="${product.name}" loading="lazy" />`;
  } else if (firstVideo) {
    mediaHTML = `<video 
      poster="${formatCloudinaryVideoPoster(firstVideo)}"
      data-src="${formatCloudinaryHoverPreview(firstVideo)}"
      class="pc-video-preview" 
      muted playsinline loop 
      onmouseover="if (!this.src && this.dataset.src) { this.src = this.dataset.src; } this.play();" 
      onmouseout="this.pause()" 
      style="width:100%; height:100%; object-fit:contain; background:transparent;">
    </video>`;
  } else {
    mediaHTML = `<div class="pc-no-image">👟</div>`;
  }

  const saleBadgeHTML = product.saleVisible ? '<div class="pc-sale-badge" style="position: static;">Sale</div>' : '';
  const videoBadgeHTML = product.videoVisible ? '<div class="pc-sale-badge" style="position: static; background-color: #2563eb;">Video Available</div>' : '';
  const badgesContainer = (saleBadgeHTML || videoBadgeHTML)
    ? `<div style="position:absolute; top:8px; left:0; display:flex; gap:8px; z-index:2; align-items:center;">
         ${saleBadgeHTML}
         ${videoBadgeHTML}
       </div>`
    : '';

  return `
    <a href="/product-details?id=${product.id}" class="product-card-link" aria-label="${product.name}">
      <article class="product-card product-card-new" data-product-id="${product.id}">
        <div class="pc-image-wrap">
          ${badgesContainer}
          <button class="pc-heart-btn ${isLiked ? 'active' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleWishlistItem('${product.id}'); this.classList.toggle('active'); this.querySelector('svg').setAttribute('fill', this.classList.contains('active') ? '#c82333' : 'none'); this.querySelector('svg').setAttribute('stroke', this.classList.contains('active') ? '#c82333' : 'currentColor')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isLiked ? '#c82333' : 'none'}" stroke="${isLiked ? '#c82333' : 'currentColor'}" stroke-width="2">
          <button class="pc-whatsapp-btn" aria-label="Contact on WhatsApp" onclick="event.preventDefault(); event.stopPropagation(); window.open('https://wa.me/916239379751?text=' + encodeURIComponent('I am interested in ' + product.name + ' - ' + window.location.origin + '/product-details?id=' + product.id), '_blank')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
            </svg>
          </button>
          ${mediaHTML}
        </div>
        <div class="pc-body">
          ${product.category ? `<div class="pc-category">${product.category}</div>` : ''}
          <h3 class="pc-name">${product.name}</h3>
          <div class="pc-price-row">
            <span class="pc-price ${originalPrice ? 'pc-price--sale' : 'pc-price--normal'}">${fmtPrice(currentPrice)}</span>
            ${originalPrice ? `<span class="pc-original-price">${fmtPrice(originalPrice)}</span>` : ''}
          </div>
        </div>
      </article>
    </a>
  `;
}

// Generate navbar HTML
export function getNavbarHTML(activePage = 'home') {
  return `
    <header class="header">
      <!-- Top Bar: Logo, Search, Icons -->
      <div class="header__top">
        <div class="container header__top-inner">
          <!-- Hamburger + Home (mobile only) -->
          <div class="mobile-left-actions">
            <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-expanded="false">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <a href="/" class="icon-btn mobile-home-btn" aria-label="Home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </a>
          </div>
          
          <a href="/" class="header__logo">
            <img src="/logos/headlogo.png" alt="KICKS AURA" class="header__logo-img" />
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
            <button class="icon-btn nav-icon" id="wishlist-trigger" aria-label="Wishlist" style="position: relative; background:none; border:none; cursor:pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="cart-badge nav-badge" id="wishlist-badge" style="display: none;">0</span>
            </button>
            <button class="icon-btn" id="cart-trigger" style="position: relative; background:none; border:none; cursor:pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span class="cart-badge navbar__cart-count" id="cart-badge">0</span>
            </button>
            <div class="profile-dropdown-wrap" id="profile-dropdown-wrap">
              <button class="icon-btn profile-icon-btn" id="profile-icon-btn" aria-label="Account" aria-haspopup="true">
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
      </div>
      
      <!-- Nav Links -->
      <nav class="header__nav">
        <div class="header__nav-inner">
          <a href="/" class="nav-link ${activePage === 'home' ? 'nav-link--active' : ''}">Home</a>
          <a href="/#shop-category" class="nav-link ${activePage === 'products' ? 'nav-link--active' : ''}">Categories</a>
          <a href="/#new-arrivals" class="nav-link">New Arrivals</a>
          <a href="/shipping-policy" class="nav-link ${activePage === 'shipping' ? 'nav-link--active' : ''}">Shipping Policy</a>
          <a href="/#customer-reviews" class="nav-link">Customer Reviews</a>
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
          <a href="/#new-arrivals" class="mobile-nav-link">
            New Arrivals
          </a>
          <a href="/shipping-policy" class="mobile-nav-link ${activePage === 'shipping' ? 'mobile-nav-link--active' : ''}">
            Shipping Policy
          </a>
          <a href="/#customer-reviews" class="mobile-nav-link">
            Customer Reviews
          </a>
        </nav>
        <div class="mobile-nav-drawer__footer">
          <span>© 2025 Kicks Aura. All rights reserved.</span>
        </div>
      </div>

      <!-- Banner (Marquee) -->
      <div class="header__banner">
        <div class="header__banner-marquee">
          <div class="marquee-content">
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span class="text-blue">PREPAID ORDERS (₹ 200 Off)</span>
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span>COD AVAILABLE (only ₹ 99 Advance)</span>
            <span class="dot">•</span>
            <span class="text-blue">1000+ HAPPY CUSTOMERS ACROSS INDIA</span>
          </div>
          <div class="marquee-content" aria-hidden="true">
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span class="text-blue">PREPAID ORDERS (₹ 200 Off)</span>
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span>COD AVAILABLE (only ₹ 99 Advance)</span>
            <span class="dot">•</span>
            <span class="text-blue">1000+ HAPPY CUSTOMERS ACROSS INDIA</span>
          </div>
          <div class="marquee-content" aria-hidden="true">
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span class="text-blue">PREPAID ORDERS (₹ 200 Off)</span>
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span>COD AVAILABLE (only ₹ 99 Advance)</span>
            <span class="dot">•</span>
            <span class="text-blue">1000+ HAPPY CUSTOMERS ACROSS INDIA</span>
          </div>
          <div class="marquee-content" aria-hidden="true">
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span class="text-blue">PREPAID ORDERS (₹ 200 Off)</span>
            <span class="dot">•</span>
            <span class="text-blue">COUPON CODE : GRAB100 (Flat ₹100 Off on Every Product)</span>
            <span class="dot">•</span>
            <span>COD AVAILABLE (only ₹ 99 Advance)</span>
            <span class="dot">•</span>
            <span class="text-blue">1000+ HAPPY CUSTOMERS</span>
          </div>
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

// Generate footer HTML
export function getFooterHTML() {
  return `
    <footer id="footer" class="footer">
      <div class="container footer__inner">
        <div class="footer__col">
          <h4>COMPANY</h4>
          <a href="/">Home</a>
          <a href="/about-us">About Us</a>
          <a href="https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Hey!" target="_blank" rel="noopener">Contact Us</a>
          <div class="footer__contact-info">
            <p><span>Address:</span> Phase 2, Chandigarh, India</p>
            <p><span>Mobile:</span> +91 6239379751</p>
            <p><span>Email:</span> kicksauraa@gmail.com</p>
          </div>
        </div>
        <div class="footer__col">
          <h4>POLICIES</h4>
          <a href="/shipping-policy">Shipping & Delivery Policy</a>
          <a href="/return-exchange">Return, Exchange & Refund</a>
          <a href="/terms-conditions">Terms & Conditions</a>
          <a href="/privacy-policy">Privacy Policy</a>
        </div>
        <div class="footer__col footer__brand">
          <div class="footer__logo-text">KICKS<span class="text-red">AURA</span></div>
          <div class="footer__socials">
            <a href="https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Hey!" target="_blank" rel="noopener">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg>
            </a>
            <a href="https://www.youtube.com/@kicksauraa" target="_blank" rel="noopener">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="https://x.com/kicksauraa" target="_blank" rel="noopener">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733-16z"></path><path d="M4 20l6.768-6.768m2.46-2.46l6.772-6.772"></path></svg>
            </a>
            <a href="https://www.reddit.com/user/NoDebt5485/" target="_blank" rel="noopener">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c-3.1 0-6.1.4-8 1.1 0 5 1.6 8 8 8s8-3 8-8c-1.9-.7-4.9-1.1-8-1.1Z"></path><path d="M12 8v-4l4-1"></path><circle cx="16" cy="3" r="1"></circle><circle cx="9" cy="13" r="1"></circle><circle cx="15" cy="13" r="1"></circle></svg>
            </a>
          </div>
          <p class="footer__join-text">Join our WhatsApp channel for exclusive drops<br/>and member coupons</p>
          <a href="https://whatsapp.com/channel/0029Vb8kKAtA2pLJLr1j7u3L" target="_blank" rel="noopener" class="btn-join-channel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg>
            Join Channel
          </a>
        </div>
      </div>
    </footer>
  `;
}

// Inject footer into the page
export function injectFooter() {
  const container = document.getElementById('footer-container');
  if (container) {
    container.innerHTML = getFooterHTML();
  }
}

// ============================================
// Purchase Notifications
// ============================================
const MALE_FIRST_NAMES = [
  "Aarav", "Vihaan", "Vivaan", "Aditya", "Arjun", "Siddharth", "Reyansh", "Ayaan", "Krishna",
  "Ishaan", "Shaurya", "Atharva", "Ayan", "Yash", "Rohan", "Rahul", "Amit", "Manish", "Kunal",
  "Rohit", "Neeraj", "Vikas", "Saurabh", "Murtuza", "Raj", "Vikram", "Kabir", "Rishi", "Aryan", "Pranav",
  "Dev", "Ravi", "Anand", "Akash", "Anil", "Sunil", "Sanjay", "Vinay", "Vijay", "Prakash"
];

const FEMALE_FIRST_NAMES = [
  "Priya", "Sneha", "Neha", "Riya", "Anjali", "Pooja", "Shruti", "Swati", "Kavya", "Ishita",
  "Pallavi", "Aanya", "Diya", "Nidhi", "Aditi", "Meera", "Tara", "Roshni", "Ritu", "Nandini",
  "Kiran", "Simran", "Preeti", "Sonia", "Kareena", "Katrina", "Priyanka", "Deepika", "Anushka", "Alia"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Reddy", "Verma", "Gupta", "Rao", "Desai", "Jain",
  "Joshi", "Mishra", "Bansal", "Mehta", "Nair", "Choudhury", "Tiwari", "Agarwal", "Bhatia", "Pandey",
  "Yadav", "Chauhan", "Hussain", "Kapoor", "Malhotra", "Das", "Sen", "Bose", "Chatterjee", "Roy",
  "Iyer", "Pillai", "Bhattacharya", "Sinha", "Ahuja"
];

function getRandomName() {
  const isBoy = Math.random() < 0.90;
  const firstNames = isBoy ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${fName} ${lName}`;
}

export async function initPurchaseNotifications() {
  return; // Disabled
  try {
    const products = await getAllProducts();
    if (!products || products.length === 0) return;

    let notificationEl = document.createElement('div');
    notificationEl.className = 'live-toast-banner';
    document.body.appendChild(notificationEl);

    const showNotification = () => {
      const name = getRandomName();
      const product = products[Math.floor(Math.random() * products.length)];

      const imgList = product.imageUrls || [];
      const img = imgList[0] && imgList[0].startsWith('http')
        ? imgList[0]
        : imgList[0] ? `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_FRONTEND}/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${imgList[0]}`
          : '';

      const productPrice = product.discountedPrice || product.basePrice || 0;
      const price = 'Rs. ' + productPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 });

      notificationEl.innerHTML = `
        <button class="live-toast-banner__close" aria-label="Close">✕</button>
        <div class="live-toast-banner__img-wrap">
          <img src="${img}" alt="${product.name}" class="live-toast-banner__img" />
        </div>
        <div class="live-toast-banner__content">
          <div class="live-toast-banner__text">
            <strong>${name}</strong> from 🇮🇳 <strong>India</strong> purchased
            <a href="/product-details?id=${product.id}" class="live-toast-banner__product-link">${product.name}</a>
          </div>
          <div class="live-toast-banner__price">${price}</div>
        </div>
      `;

      notificationEl.querySelector('.live-toast-banner__close').addEventListener('click', (e) => {
        e.stopPropagation();
        notificationEl.classList.remove('show');
      });

      notificationEl.onclick = () => {
        window.location.href = `/product-details?id=${product.id}`;
      };

      // ── Swipe-to-dismiss (mobile touch) ────────────────
      let touchStartY = 0;
      let currentDeltaY = 0;
      const SWIPE_THRESHOLD = 60; // px needed to trigger dismiss

      const isMobile = () => window.innerWidth <= 768;

      const onTouchStart = (e) => {
        if (!isMobile()) return;
        touchStartY = e.touches[0].clientY;
        currentDeltaY = 0;
        // Disable CSS transition while dragging for instant feel
        notificationEl.style.transition = 'opacity 0.15s ease';
      };

      const onTouchMove = (e) => {
        if (!isMobile()) return;
        currentDeltaY = e.touches[0].clientY - touchStartY;
        // Follow the finger — offset relative to centred "show" position
        notificationEl.style.transform = `translate(-50%, ${currentDeltaY}px)`;
        // Fade out as it moves away
        const opacity = Math.max(0, 1 - Math.abs(currentDeltaY) / 160);
        notificationEl.style.opacity = String(opacity);
        e.preventDefault(); // prevent page scroll while swiping the toast
      };

      const onTouchEnd = () => {
        if (!isMobile()) return;
        // Restore smooth transition
        notificationEl.style.transition = 'transform 0.35s ease, opacity 0.35s ease';

        if (Math.abs(currentDeltaY) >= SWIPE_THRESHOLD) {
          // Flick off in the direction of the swipe
          const flyOut = currentDeltaY < 0 ? '-160%' : '160%';
          notificationEl.style.transform = `translate(-50%, ${flyOut})`;
          notificationEl.style.opacity = '0';
          setTimeout(() => {
            notificationEl.classList.remove('show');
            notificationEl.style.transform = '';
            notificationEl.style.opacity = '';
          }, 350);
        } else {
          // Short swipe — snap back to centre
          notificationEl.style.transform = 'translate(-50%, 0)';
          notificationEl.style.opacity = '1';
        }
        currentDeltaY = 0;
      };

      notificationEl.addEventListener('touchstart', onTouchStart, { passive: true });
      notificationEl.addEventListener('touchmove', onTouchMove, { passive: false });
      notificationEl.addEventListener('touchend', onTouchEnd, { passive: true });
      // ────────────────────────────────────────────────────

      // Show it
      notificationEl.classList.add('show');

      // Auto-hide after 5 seconds
      setTimeout(() => {
        notificationEl.classList.remove('show');
      }, 5000);

      // Schedule next notification between 80s and 90s
      const nextDelay = 80000 + Math.random() * 10000;
      setTimeout(showNotification, nextDelay);
    };

    let initialDelay = 4000;
    if (sessionStorage.getItem('hasSeenPurchaseNotification')) {
      initialDelay = 80000 + Math.random() * 10000;
    } else {
      sessionStorage.setItem('hasSeenPurchaseNotification', 'true');
    }

    // Initial delay then trigger first one
    setTimeout(() => {
      showNotification();
    }, initialDelay);

  } catch (e) {
    console.error('Error initPurchaseNotifications:', e);
  }
}

// Mobile hamburger menu
export function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');
  if (!btn || !drawer || !overlay) return;

  const open = () => {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', close);
  });
}

// Automatically initialize when DOM is ready
function initializeUI() {
  injectFooter();
  // initPurchaseNotifications(); // Disabled
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}
