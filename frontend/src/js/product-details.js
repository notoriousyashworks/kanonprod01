/* ============================================
   Product Details Page
   ============================================ */
import { getProductById } from './api.js';
import { getNavbarHTML, getFooterHTML, showToast, formatCloudinaryUrl, initSearch } from './ui.js';
import { addToCart, updateCartBadge } from './cart.js';
import { initWishlistSidebar, updateWishlistBadge, isWishlisted, toggleWishlistItem } from './wishlist.js';
import { initCartSidebar, openShippingPolicyModal } from './cart-sidebar.js';
import { initProfileDropdown } from './profile.js';
import { initLoginModalTrigger } from './login-modal.js';

// Render navbar & footer
document.getElementById('navbar-container').innerHTML = getNavbarHTML('product');
document.getElementById('footer-container').innerHTML = getFooterHTML();
updateCartBadge();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initProfileDropdown();
initSearch();
initLoginModalTrigger();

const fmtPrice = (p) => p != null ? '₹' + p.toLocaleString('en-IN') : '';

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    renderError('No product ID specified in the URL.');
    return;
  }

  try {
    const product = await getProductById(productId);
    renderProduct(product);
  } catch (err) {
    console.error('Failed to load product:', err);
    renderError('Could not load product. Please try again.');
  }
}

function renderError(msg) {
  document.getElementById('product-container').innerHTML = `
    <div style="padding: 80px 20px; text-align: center; grid-column: 1/-1;">
      <p style="font-size: 18px; font-weight: 600; color: #222;">⚠️ ${msg}</p>
      <a href="/" style="display:inline-block; margin-top: 16px; color: #c82333; font-weight: 600;">← Back to Home</a>
    </div>`;
}

function renderProduct(product) {
  // Update page title
  document.title = `${product.name} — KicksAura`;

  const images = (product.imageUrls?.length > 0 ? product.imageUrls : []).map(formatCloudinaryUrl);
  const videos = product.videoUrls?.length > 0 ? product.videoUrls : [];
  const mediaItems = [
    ...images.map(url => ({ type: 'image', url })),
    ...videos.map(url => ({ type: 'video', url }))
  ];

  const currentPrice = product.discountedPrice || product.basePrice;
  const originalPrice = product.discountedPrice ? product.basePrice : null;
  const liked = isWishlisted(product.id);

  const vendorText = (product.brand?.name || product.brandName || product.category?.name || 'KICKS AURA').toUpperCase();
  const discountPct = originalPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
  const totalStock = product.variants?.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
    : (product.stockQuantity ?? 10);
  const isInStock = totalStock > 0;
  const initialViewers = Math.floor(Math.random() * 3) + 6; // 6 to 8 (always > 5)
  const initialCarts = Math.floor(Math.random() * 4) + 1; // 1 to 4

  // Thumbnails HTML — vertical strip
  // Video thumbnails: use the primary product image as a cover, overlaid with a play icon
  const thumbnailsHTML = mediaItems.map((item, i) => {
    if (item.type === 'video') {
      const coverImage = images.length > 0 ? images[0] : item.url;
      return `
        <div class="thumb-item thumb-video ${i === 0 ? 'active' : ''}" data-idx="${i}" title="Watch video">
          <div class="thumb-video-placeholder">
            <img src="${coverImage}" loading="lazy" alt="Video cover" />
            <div class="thumb-video-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
        </div>`;
    } else {
      // First image: eager (already in viewport). Rest: lazy.
      return `
        <div class="thumb-item ${i === 0 ? 'active' : ''}" data-idx="${i}">
          <img src="${item.url}" alt="${product.name} ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" />
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
      <div class="main-media-slide" data-idx="${idx}">
        ${item.type === 'video'
        ? `<video
               src="${item.url}"
               id="main-video-${idx}"
               controls
               controlsList="nofullscreen nodownload noplaybackrate"
               disablePictureInPicture
               preload="metadata"
               playsinline
               onclick="this.paused ? this.play() : this.pause()"
               style="cursor:pointer; width:100%; height:100%; object-fit:contain; background:transparent;"
             ></video>`
        : `<img
               ${idx === 0 ? `src="${item.url}"` : `data-src="${item.url}"`}
               alt="${product.name}"
               id="main-image-${idx}"
               loading="${idx === 0 ? 'eager' : 'lazy'}"
               decoding="async"
               style="width:100%; height:100%; object-fit:contain; background:transparent;"
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

  const hasVariants = product.variants && product.variants.length > 0;

  // Size variant buttons
  const variantsHTML = hasVariants
    ? product.variants.map(v => `
        <button class="size-btn ${v.stockQuantity <= 0 ? 'size-btn--oos' : ''}"
          data-variant-id="${v.id}"
          data-stock="${v.stockQuantity}"
          ${v.stockQuantity <= 0 ? 'disabled title="Out of stock"' : ''}>
          ${v.size}
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

  document.getElementById('product-container').innerHTML = `
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
      <h1 class="product-title pd-title-modern">${product.name}</h1>
      
      <div class="pd-pricing-section">
        ${originalPrice && discountPct > 0 ? `<div class="pd-discount-badge">${discountPct}% off</div>` : ''}
        ${originalPrice && discountPct > 0 ? `<div class="pd-orig-price">${fmtPrice(originalPrice)}</div>` : ''}
        <div class="pd-curr-price ${originalPrice && discountPct > 0 ? 'pd-curr-price--sale' : ''}">${fmtPrice(currentPrice)}</div>
      </div>
      
      <p class="pd-shipping-link"><a href="/shipping-policy" class="pd-open-shipping-modal" style="color: #2563eb; text-decoration: underline; cursor: pointer;">Shipping</a> calculated at checkout.</p>
      
      <div class="pd-live-viewers-row">
        <div class="pd-viewers-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span id="pd-viewers-num">${initialViewers}</span>
        </div>
        <span class="pd-viewers-label">People are currently viewing this</span>
      </div>

      <div class="pd-stock-status-row" style="margin-bottom: 8px;">
        ${isInStock ? `
          <div class="pd-stock-icon-circle pd-stock-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span class="pd-stock-text pd-stock-in-text">In stock!</span>
        ` : `
          <div class="pd-stock-icon-circle pd-stock-out">✕</div>
          <span class="pd-stock-text pd-stock-out-text">Currently out of stock</span>
        `}
      </div>
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

      <div class="action-row">
        <button class="btn-add-to-cart" id="add-to-cart-btn">ADD TO CART</button>
        <button class="btn-buy-now" id="buy-now-btn">BUY NOW</button>
      </div>
      <div style="text-align: left; margin-top: -12px; margin-bottom: 32px; padding-left: 2px;">
        <span style="font-size: 14px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Guaranteed Safe Checkout
        </span>
      </div>

      ${product.description ? `
        <div class="product-description-section">
          <h2>Description</h2>
          <p>${product.description}</p>
        </div>` : ''}
    </div>
  `;

  // Lightbox state
  let lbIdx = 0;

  function openLightbox(idx) {
    lbIdx = idx;
    const item = mediaItems[lbIdx];
    const lb = document.getElementById('img-lightbox');
    const lbContent = document.getElementById('lightbox-content');
    if (!lb || !lbContent || !item) return;

    // Pause background video if it is playing
    const bgVideo = document.querySelector(`.main-media-slide[data-idx="${currentIdx}"] video`);
    if (bgVideo) bgVideo.pause();

    lbContent.innerHTML = item.type === 'video'
      ? `<video src="${item.url}" controls controlsList="nodownload" playsinline autoplay onclick="this.paused ? this.play() : this.pause()" style="cursor:pointer; display:block; width:100%; max-height:82vh; object-fit:contain; background:#000; border-radius:8px;"></video>`
      : `<img src="${item.url}" alt="" style="display:block; width:100%; max-height:82vh; object-fit:contain; border-radius:8px; background:transparent;" />`;

    // Update arrow visibility
    const prev = document.getElementById('lb-prev');
    const next = document.getElementById('lb-next');
    if (prev) prev.style.opacity = lbIdx === 0 ? '0.3' : '1';
    if (next) next.style.opacity = lbIdx === mediaItems.length - 1 ? '0.3' : '1';

    // Counter removed
    const counter = document.getElementById('lb-counter');
    if (counter) counter.style.display = 'none';

    lb.classList.add('open');
  }

  function closeLightbox() {
    const lb = document.getElementById('img-lightbox');
    lb?.classList.remove('open');
    // Stop any video playing
    document.getElementById('lightbox-content')?.querySelector('video')?.pause();
  }

  // Inject lightbox modal (once)
  if (!document.getElementById('img-lightbox')) {
    const lb = document.createElement('div');
    lb.id = 'img-lightbox';
    lb.innerHTML = `
      <div class="lightbox-backdrop" id="lightbox-backdrop">
        <div class="lightbox-box">
          <button class="lightbox-close" id="lightbox-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <button class="lb-nav-btn lb-nav-btn--prev" id="lb-prev" aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div id="lightbox-content"></div>
          <button class="lb-nav-btn lb-nav-btn--next" id="lb-next" aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>

        </div>
      </div>`;
    document.body.appendChild(lb);

    document.getElementById('lightbox-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeLightbox();
    });
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', () => {
      if (lbIdx > 0) openLightbox(lbIdx - 1);
    });
    document.getElementById('lb-next').addEventListener('click', () => {
      if (lbIdx < mediaItems.length - 1) openLightbox(lbIdx + 1);
    });
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('img-lightbox')?.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && lbIdx > 0) openLightbox(lbIdx - 1);
      if (e.key === 'ArrowRight' && lbIdx < mediaItems.length - 1) openLightbox(lbIdx + 1);
    });
  }

  // Inject Size Chart Drawer (once)
  const drawerBrandText = product.brand || product.category || 'Kicks Aura';
  if (!document.getElementById('size-chart-drawer')) {
    const scDrawer = document.createElement('div');
    scDrawer.id = 'size-chart-drawer';
    scDrawer.innerHTML = `
      <div class="size-chart-drawer-header">
        <div class="sc-brand-row">
          <h2 id="sc-brand-name">Brand : ${drawerBrandText}</h2>
          <button class="size-chart-close-btn" id="size-chart-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="sc-tabs-row">
          <button class="sc-tab active">Size Guide</button>
        </div>
      </div>
      <div class="size-chart-drawer-content" id="size-chart-content">
        <h3 class="sc-content-title">Foot Measurement</h3>
        <!-- Blank content for size chart -->
      </div>
    `;
    const scBackdrop = document.createElement('div');
    scBackdrop.id = 'size-chart-backdrop';

    document.body.appendChild(scBackdrop);
    document.body.appendChild(scDrawer);

    const closeDrawer = () => {
      scDrawer.classList.remove('open');
      scBackdrop.classList.remove('open');
    };

    document.getElementById('size-chart-close').addEventListener('click', closeDrawer);
    scBackdrop.addEventListener('click', closeDrawer);
  } else {
    const brandNameEl = document.getElementById('sc-brand-name');
    if (brandNameEl) brandNameEl.textContent = `Brand : ${drawerBrandText}`;
  }

  document.getElementById('size-chart-btn')?.addEventListener('click', async () => {
    const drawer = document.getElementById('size-chart-drawer');
    const backdrop = document.getElementById('size-chart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('open');
      backdrop.classList.add('open');

      const contentDiv = document.getElementById('size-chart-content');

      // ── Hardcoded size chart data per brand ──────────────────────────
      const BRAND_SIZE_DATA = {
        // New Balance — from earlier image
        'new balance': {
          headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
          rows: [
            ['UK 6', '39.5', '24.5'],
            ['UK 6.5', '40', '25'],
            ['UK 7', '40.5', '25.5'],
            ['UK 7.5', '41.5', '26'],
            ['UK 8', '42', '26.5'],
            ['UK 8.5', '42.5', '27'],
            ['UK 9', '43', '27.5'],
            ['UK 9.5', '44', '28'],
            ['UK 10', '44.5', '28.5'],
            ['UK 10.5', '45', '29'],
            ['UK 11', '45.5', '29.5'],
            ['UK 11.5', '46.5', '30'],
          ]
        },
        // Nike — image 3 (exact data)
        'nike': {
          headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
          rows: [
            ['UK 6 (EU 40)', '40', '24.5'],
            ['UK 6.5', '40.5', '25'],
            ['UK 7', '41', '25.4'],
            ['UK 7.5', '42', '25.8'],
            ['UK 8', '42.5', '26.2'],
            ['UK 8.5', '43', '26.7'],
            ['UK 9', '44', '27.1'],
            ['UK 9.5', '44.5', '27.5'],
            ['UK 10', '45', '27.9'],
            ['UK 10.5', '45.5', '28.3'],
            ['UK 11.5', '47', '29.2'],
          ]
        },
        // Adidas — image 1 (exact data)
        'adidas': {
          headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
          rows: [
            ['UK 6', '39 1/3', '24.5'],
            ['UK 6.5', '40', '25'],
            ['UK 7', '40 2/3', '25.5'],
            ['UK 7.5', '41 1/3', '26'],
            ['UK 8', '42', '26.5'],
            ['UK 8.5', '42 2/3', '27'],
            ['UK 9', '43 1/3', '27.5'],
            ['UK 9.5', '44', '28'],
            ['UK 10', '44 2/3', '28.5'],
            ['UK 10.5', '45 1/3', '29'],
            ['UK 11', '46', '29.5'],
            ['UK 11.5', '46 2/3', '30'],
          ]
        },
        // Crocs — image 2 (exact data)
        'crocs': {
          headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
          rows: [
            ['UK 6', '37-38', '24.5'],
            ['UK 6.5', '38-39', '25'],
            ['UK 7', '39-40', '25.5'],
            ['UK 7.5', '41-42', '26'],
            ['UK 8', '41-42', '26.5'],
            ['UK 8.5', '42-43', '27'],
            ['UK 9', '42-43', '27.5'],
            ['UK 9.5', '43-44', '28'],
            ['UK 10', '45-46', '28.5'],
            ['UK 10.5', '45-46', '29'],
            ['UK 11', '46-47', '29.5'],
            ['UK 11.5', '48-49', '30'],
          ]
        },
        // On Cloud — image 4 (exact data)
        'on cloud': {
          headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
          rows: [
            ['UK 6', '39', '24.5'],
            ['UK 6.5', '40', '25'],
            ['UK 7', '40.5', '25.5'],
            ['UK 7.5', '41', '26'],
            ['UK 8', '42', '26.5'],
            ['UK 8.5', '42.5', '27'],
            ['UK 9', '43', '27.5'],
            ['UK 9.5', '44', '28'],
            ['UK 10', '44.5', '28.5'],
            ['UK 10.5', '45', '29'],
            ['UK 11', '46', '29.5'],
            ['UK 11.5', '47', '30'],
          ]
        },
        // Onitsuka Tiger — image 5 (exact data)
        'onitsuka tiger': {
          headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
          rows: [
            ['UK 6', '39', '24.5'],
            ['UK 6.5', '39.5', '25'],
            ['UK 7', '40.5', '25.5'],
            ['UK 7.5', '41.5', '26'],
            ['UK 8', '42', '26.5'],
            ['UK 8.5', '42.5', '27'],
            ['UK 9', '43.5', '27.5'],
            ['UK 9.5', '44', '28'],
            ['UK 10', '44.5', '28.5'],
            ['UK 10.5', '45', '29'],
            ['UK 11', '46', '29.5'],
            ['UK 11.5', '46.5', '30'],
          ]
        }
      };

      const brandKey = (drawerBrandText || '').toLowerCase();
      const chartData = BRAND_SIZE_DATA[brandKey];

      if (chartData) {
        const headerCells = chartData.headers.map(h => `<th>${h}</th>`).join('');
        const bodyRows = chartData.rows.map((row, i) =>
          `<tr class="${i % 2 === 0 ? 'sc-row-even' : 'sc-row-odd'}">${row.map((cell, ci) => `<td class="${ci === 0 ? 'sc-td-first' : ''}">${cell}</td>`).join('')}</tr>`
        ).join('');
        contentDiv.innerHTML = `
          <h3 class="sc-content-title">Foot Measurement</h3>
          <div class="sc-table-wrap">
            <table class="sc-table">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
          <div class="sc-footer">
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/916239379751?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
          </div>`;
      } else {
        // Fallback: show Nike's size chart for any unknown brand
        const nikeData = BRAND_SIZE_DATA['nike'];
        const headerCells = nikeData.headers.map(h => `<th>${h}</th>`).join('');
        const bodyRows = nikeData.rows.map((row, i) =>
          `<tr class="${i % 2 === 0 ? 'sc-row-even' : 'sc-row-odd'}">${row.map((cell, ci) => `<td class="${ci === 0 ? 'sc-td-first' : ''}">${cell}</td>`).join('')}</tr>`
        ).join('');
        contentDiv.innerHTML = `
          <h3 class="sc-content-title">Foot Measurement</h3>
          <div class="sc-table-wrap">
            <table class="sc-table">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
          <div class="sc-footer">
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/916239379751?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
          </div>`;
      }
    }
  });

  // Shared slide index — used by goToMedia, bindExpandBtn, bindMainMediaArrows
  let currentIdx = 0;

  function bindExpandBtn() {
    document.getElementById('expand-btn')?.addEventListener('click', () => {
      openLightbox(currentIdx);
    });
  }

  function bindWishlistDetailBtn() {
    document.getElementById('wishlist-detail-btn')?.addEventListener('click', () => {
      toggleWishlistItem(product);
      const btn = document.getElementById('wishlist-detail-btn');
      const nowLiked = isWishlisted(product.id);
      btn?.classList.toggle('active', nowLiked);
      btn?.querySelector('svg')?.setAttribute('fill', nowLiked ? '#c82333' : 'none');
      btn?.querySelector('svg')?.setAttribute('stroke', nowLiked ? '#c82333' : 'currentColor');
      updateWishlistBadge();
    });
  }


  // ── goToMedia: lazy-loads images/videos on demand, preloads neighbours ──
  function goToMedia(idx) {
    if (idx < 0 || idx >= mediaItems.length) return;
    const prevIdx = currentIdx;
    currentIdx = idx;

    // 1. Update active thumbnail
    document.querySelectorAll('#thumb-strip .thumb-item').forEach(t => t.classList.remove('active'));
    const activeThumb = document.querySelector(`#thumb-strip .thumb-item[data-idx="${idx}"]`);
    if (activeThumb) {
      activeThumb.classList.add('active');
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 2. Lazy-load this slide's image if not yet loaded
    const thisSlide = document.querySelector(`.main-media-slide[data-idx="${idx}"]`);
    if (thisSlide) {
      const lazyImg = thisSlide.querySelector('img[data-src]');
      if (lazyImg) {
        lazyImg.src = lazyImg.dataset.src;
        delete lazyImg.dataset.src;
      }
    }

    // 3. Preload adjacent images silently (next + prev) so they're ready
    [idx - 1, idx + 1].forEach(adjIdx => {
      if (adjIdx < 0 || adjIdx >= mediaItems.length) return;
      const adjSlide = document.querySelector(`.main-media-slide[data-idx="${adjIdx}"]`);
      if (!adjSlide) return;
      const adjImg = adjSlide.querySelector('img[data-src]');
      if (adjImg) {
        adjImg.src = adjImg.dataset.src;
        delete adjImg.dataset.src;
      }
    });

    // 4. Pause any playing video on the previous slide
    const prevSlide = document.querySelector(`.main-media-slide[data-idx="${prevIdx}"]`);
    prevSlide?.querySelector('video')?.pause();

    // 5. Slide the track
    const track = document.getElementById('main-media-track');
    if (track) {
      track.style.transform = `translate3d(-${idx * 100}%, 0, 0)`;
    }
  }

  // Thumbnail click
  document.querySelectorAll('#thumb-strip .thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      goToMedia(parseInt(thumb.dataset.idx));
    });
  });

  // Size selection
  let selectedVariant = null;
  document.querySelectorAll('.size-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedVariant = product.variants.find(v => String(v.id) === String(btn.dataset.variantId));
    });
  });

  // Helper: shake the size section to prompt selection
  function shakeSize() {
    const sizeSection = document.querySelector('.size-section');
    if (!sizeSection) return;
    sizeSection.classList.remove('size-shake');
    void sizeSection.offsetWidth; // reflow to restart animation
    sizeSection.classList.add('size-shake');
    showToast('Please select a size first', 'error');
  }

  // Quantity stepper
  let quantity = 1;
  const qtyValue = document.getElementById('qty-value');
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      if (qtyValue) qtyValue.textContent = quantity;
    }
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (quantity < 10) {
      quantity++;
      if (qtyValue) qtyValue.textContent = quantity;
    }
  });

  bindWishlistDetailBtn();
  bindExpandBtn();

  document.querySelector('.pd-open-shipping-modal')?.addEventListener('click', (e) => {
    e.preventDefault();
    openShippingPolicyModal();
  });

  // Live simulation for dynamic engagement
  if (window._pdLiveInterval) clearInterval(window._pdLiveInterval);
  window._pdLiveInterval = setInterval(() => {
    const viewersEl = document.getElementById('pd-viewers-num');
    if (viewersEl) {
      let currentV = parseInt(viewersEl.textContent || '6');
      const change = Math.random() > 0.5 ? 1 : -1;
      const newV = Math.max(6, Math.min(8, currentV + change));
      viewersEl.textContent = newV;
    }
  }, 9000);

  // Live video option box interaction
  const liveOptionBox = document.getElementById('live-video-option-box');
  const liveCheck = document.getElementById('live-video-check');
  if (liveOptionBox && liveCheck) {
    liveOptionBox.addEventListener('click', (e) => {
      if (e.target !== liveCheck) {
        liveCheck.checked = !liveCheck.checked;
      }
      if (liveCheck.checked) {
        liveOptionBox.style.borderColor = '#2563eb';
        liveOptionBox.style.background = '#eff6ff';
      } else {
        liveOptionBox.style.borderColor = '#e2e8f0';
        liveOptionBox.style.background = '#f8fafc';
      }
    });
    liveCheck.addEventListener('change', () => {
      if (liveCheck.checked) {
        liveOptionBox.style.borderColor = '#2563eb';
        liveOptionBox.style.background = '#eff6ff';
      } else {
        liveOptionBox.style.borderColor = '#e2e8f0';
        liveOptionBox.style.background = '#f8fafc';
      }
    });
  }

  // Add to cart
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    if (hasVariants && !selectedVariant) {
      shakeSize();
      return;
    }
    const variantToAdd = hasVariants ? selectedVariant : null;
    const liveVideoCall = document.getElementById('live-video-check')?.checked || false;
    addToCart(product, variantToAdd, quantity, { liveVideoCall });
    const sizeLabel = hasVariants ? ` (${variantToAdd.size})` : '';
    const qtyLabel = quantity > 1 ? ` × ${quantity}` : '';
    const videoLabel = liveVideoCall ? ` (Live Video Call Requested)` : '';
    showToast(`${product.name}${sizeLabel}${qtyLabel} added to cart!${videoLabel}`, 'success');
    updateCartBadge();
  });

  // Buy now
  document.getElementById('buy-now-btn')?.addEventListener('click', () => {
    if (hasVariants && !selectedVariant) {
      shakeSize();
      return;
    }
    const variantToAdd = hasVariants ? selectedVariant : null;
    const liveVideoCall = document.getElementById('live-video-check')?.checked || false;
    addToCart(product, variantToAdd, quantity, { liveVideoCall });
    sessionStorage.setItem('checkout_intent', 'true');
    window.location.href = '/checkout';
  });
}

loadProduct();
