/* ============================================
   Product Details Page
   ============================================ */
import { getProductById, getRelatedProducts } from './api.js';
import { getNavbarHTML, getFooterHTML, showToast, formatCloudinaryUrl, formatCloudinaryVideoPoster, formatCloudinaryVideoHls, formatCloudinaryVideoMp4, formatMediaUrl, formatVideoPoster, formatVideoHls, formatVideoMp4, formatVideoHoverPreview, initSearch, initMobileMenu, createProductCard } from './ui.js';
import { buildProductView, productDetailHTML } from './shared/templates.js';
import { productTitle } from './shared/seo.js';
import { addToCart, updateCartBadge } from './cart.js';
import { initWishlistSidebar, updateWishlistBadge, isWishlisted, toggleWishlistItem } from './wishlist.js';
import { initCartSidebar, openShippingPolicyModal } from './cart-sidebar.js';
import { initProfileDropdown } from './profile.js';
import { initLoginModalTrigger } from './login-modal.js';

// Kick off the API fetch immediately (parallel to UI rendering)
loadProduct();

// Render navbar & footer
document.getElementById('navbar-container').innerHTML = getNavbarHTML('product');
document.getElementById('footer-container').innerHTML = getFooterHTML();
initMobileMenu();
updateCartBadge();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initProfileDropdown();
initSearch();
initLoginModalTrigger();

// Product JSON embedded by the SSR renderer (same data it used for the HTML),
// so the page doesn't need a second API round-trip.
function readSsrProduct(productId) {
  try {
    const el = document.getElementById('ka-ssr-data');
    if (!el) return null;
    const data = JSON.parse(el.textContent || 'null');
    return data && data.product && String(data.product.id) === String(productId) ? data.product : null;
  } catch {
    return null;
  }
}

function hasSsrProductMarkup() {
  return !!document.querySelector('#product-container .product-details');
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    renderError('No product ID specified in the URL.');
    return;
  }

  const ssrProduct = readSsrProduct(productId);
  if (ssrProduct) {
    await null; // let the navbar/footer bootstrap below run first, as with a fetch
    renderProduct(ssrProduct);
    return;
  }

  try {
    const product = await getProductById(productId);
    renderProduct(product);
  } catch (err) {
    console.error('Failed to load product:', err);
    // Keep server-rendered content rather than replacing it with an error.
    if (hasSsrProductMarkup()) return;
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

// Initialize video playback on interaction or warmup
window.initVideoPlayback = function(video, isWarmup = false) {
  if (!video) return;

  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  // Initialize state if missing
  if (!video.dataset.initState) {
    video.dataset.initState = 'none';
  }

  if (isWarmup) {
    console.log('[HLS] Warmup requested', { video: video.id });
    if (video.dataset.initState !== 'none') return; // already warmed up or playing
  } else {
    console.log('[HLS] User requested playback', { video: video.id });
    if (isTouchDevice && (video.dataset.initState === 'ready' || video.dataset.initState === 'playing')) {
       // Mobile: hand off to native controls entirely after first interaction.
       // This prevents our JS from forcefully toggling play/pause when the user taps to show controls.
       return;
    }
    if (video.dataset.initState === 'ready' || video.dataset.initState === 'playing') {
      // Allow native controls to handle play/pause after initialization
      return;
    }
  }

  video.dataset.initState = isWarmup ? 'warmup' : 'ready';
  console.log(`[HLS] Initializing (State: ${video.dataset.initState})`);

  const hlsSrc = video.dataset.hlsSrc;
  const mp4Src = video.dataset.mp4Src;

  if (video.hlsInstance) {
    video.hlsInstance.destroy();
    video.hlsInstance = null;
  }

  // Setup UI overlays
  if (video.parentElement && !video.dataset.listenersAttached) {
    video.dataset.listenersAttached = 'true';
    
    const playBtn = video.parentElement.querySelector('.center-play-btn');
    if (!isWarmup && playBtn) playBtn.style.display = 'none';

    const PLAY_SVG  = '<svg width="34" height="34" viewBox="0 0 24 24" fill="white"><polygon points="6,3 21,12 6,21"/></svg>';
    const PAUSE_SVG = '<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>';

    const hideBtn = (delay = 0) => {
      clearTimeout(playBtn?._fadeTimer);
      if (playBtn) {
        playBtn._fadeTimer = setTimeout(() => {
          playBtn.style.opacity = '0'; playBtn.style.pointerEvents = 'none';
        }, delay);
      }
    };

    video.parentElement.addEventListener('mouseleave', () => {
      if (playBtn && !video.paused && video.dataset.initState !== 'warmup') hideBtn(0);
    });

    video.addEventListener('playing', () => {
      video.dataset.initState = 'playing';
      if (playBtn) {
        playBtn.innerHTML = PAUSE_SVG;
        playBtn.setAttribute('aria-label', 'Pause video');
        playBtn.style.display = 'flex';
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = 'auto';
        hideBtn(600);
      }
    });

    video.addEventListener('mousemove', () => {
      if (playBtn && !video.paused && video.dataset.initState !== 'warmup') {
        clearTimeout(playBtn._fadeTimer);
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = 'auto';
        hideBtn(800);
      }
    });

    video.addEventListener('waiting', () => {
      if (video.dataset.initState === 'warmup') return;
      if (playBtn) { playBtn.style.opacity = '0'; playBtn.style.pointerEvents = 'none'; }
    });

    video.addEventListener('pause', () => {
      clearTimeout(playBtn?._fadeTimer);
      if (playBtn && video.dataset.initState !== 'warmup') {
        playBtn.innerHTML = PLAY_SVG;
        playBtn.setAttribute('aria-label', 'Play video');
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = 'auto';
        playBtn.style.display = 'flex';
      }
    });

    video.addEventListener('ended', () => {
      clearTimeout(playBtn?._fadeTimer);
      if (playBtn && video.dataset.initState !== 'warmup') {
        playBtn.innerHTML = PLAY_SVG;
        playBtn.setAttribute('aria-label', 'Play video');
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = 'auto';
        playBtn.style.display = 'flex';
      }
    });

    video.addEventListener('error', () => {
      if (playBtn && video.dataset.initState !== 'warmup') {
        playBtn.innerHTML = PLAY_SVG;
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = 'auto';
        playBtn.style.display = 'flex';
      }
    });
  }

  // If hlsSrc is falsy or "null" (e.g. plain .mp4 BunnyCDN URL), skip HLS entirely and play mp4 directly
  if (!hlsSrc || hlsSrc === 'null' || hlsSrc === 'undefined') {
    console.log('[HLS] No HLS source — falling back directly to mp4');
    video.src = mp4Src;
    if (!isWarmup) {
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
    return;
  }

  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls({ 
      startLevel: -1,
      capLevelToPlayerSize: true, 
      maxBufferLength: 5,         
      maxMaxBufferLength: 10,
      startFragPrefetch: true
    });
    video.hlsInstance = hls;

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      console.log('[HLS] MEDIA_ATTACHED');
      hls.loadSource(hlsSrc);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      console.log('[HLS] MANIFEST_PARSED - Ready');
      if (video.dataset.initState === 'ready' || video.dataset.initState === 'playing') {
        if (video.paused) {
          const p = video.play();
          if (p !== undefined) p.catch(() => {});
        }
      }
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
          video.hlsInstance = null;
          video.src = mp4Src;
          video.load();
          if (video.dataset.initState === 'ready' || video.dataset.initState === 'playing') {
            const p = video.play();
            if (p !== undefined) p.catch(() => {});
          }
        }
      }
    });

    hls.attachMedia(video);
    
    if (!isWarmup) {
      const playPromise = video.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
    
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = hlsSrc;
    if (!isWarmup) {
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
  } else {
    video.src = mp4Src;
    if (!isWarmup) {
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
  }
};

window.centerPlayBtnClick = function(btn) {
  console.log('[VIDEO UI] play button clicked');
  const v = btn.parentElement ? btn.parentElement.querySelector('video') : null;
  if (!v) return;

  if (v.dataset.initState === 'warmup') {
    v.dataset.initState = 'ready';
    btn.style.display = 'none';
    
    const p = v.play();
    if (p !== undefined) p.catch(e => console.warn('[VIDEO UI] Warmup playback failed:', e));
    return;
  }

  if (v.dataset.initState === 'ready' || v.dataset.initState === 'playing') {
    if (v.paused || v.ended) {
      const p = v.play();
      if (p !== undefined) {
        p.catch(e => {
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        });
      }
    } else {
      v.pause();
    }
  } else {
    window.initVideoPlayback(v, false);
  }
};

function renderProduct(product) {
  // Update page title (same formula as the SSR renderer)
  document.title = productTitle(product);

  // Markup is shared with the SSR renderer (src/js/shared/templates.js) so the
  // server-rendered HTML and this client render are identical.
  const view = buildProductView(product);
  const { mediaItems, hasVariants } = view;
  const liked = isWishlisted(product.id);

  document.getElementById('product-container').innerHTML = productDetailHTML(product, view, {
    liked,
    whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER,
    origin: window.location.origin,
  });


  // Intersection Observer for Video Warmup
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          if (video.dataset.initState !== 'warmup' && video.dataset.initState !== 'ready' && video.dataset.initState !== 'playing') {
            window.initVideoPlayback(video, true);
          }
          obs.unobserve(video); // Only warmup once
        }
      });
    }, { rootMargin: '50% 0px 50% 0px' });
    
    document.querySelectorAll('.ka-lazy-video').forEach(v => observer.observe(v));
  }

  // Render related products below the product section
  renderRelatedProducts(product);

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
      ? `<div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
           <video 
             poster="${formatCloudinaryVideoPoster(item.url)}"
             data-hls-src="${formatCloudinaryVideoHls(item.url)}"
             data-mp4-src="${formatCloudinaryVideoMp4(item.url)}"
             controls controlsList="nodownload" playsinline autoplay 
             onclick="window.initVideoPlayback(this, false)"
             style="cursor:pointer; display:block; width:100%; max-height:82vh; object-fit:contain; background:#000; border-radius:8px;">
           </video>
           <button class="center-play-btn" style="display:none;" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
           </button>
         </div>`
      : `<img src="${item.url}" alt="" style="display:block; width:100%; max-height:82vh; object-fit:contain; border-radius:8px; background:transparent;" />`;

    if (item.type === 'video') {
      setTimeout(() => {
        const v = lbContent.querySelector('video');
        if (v) window.initVideoPlayback(v);
      }, 50);
    }

    // Update arrow visibility: hide entirely when showing a video, show for images
    const prev = document.getElementById('lb-prev');
    const next = document.getElementById('lb-next');
    if (item.type === 'video') {
      // No prev/next navigation when viewing a video in the lightbox
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
    } else {
      if (prev) { prev.style.display = ''; prev.style.opacity = lbIdx === 0 ? '0.3' : '1'; }
      if (next) { next.style.display = ''; next.style.opacity = lbIdx === mediaItems.length - 1 ? '0.3' : '1'; }
    }

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
            ['UK 5', '38.5', '23.5'],
            ['UK 5.5', '39', '24'],
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
            ['UK 5', '38', '23.5'],
            ['UK 5.5', '38.5', '24'],
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
            ['UK 5', '38', '23.5'],
            ['UK 5.5', '38 2/3', '24'],
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
            ['UK 5', '36-37', '23.5'],
            ['UK 5.5', '37-38', '24'],
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
            ['UK 5', '38', '23.5'],
            ['UK 5.5', '38.5', '24'],
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
            ['UK 5', '37.5', '23.5'],
            ['UK 5.5', '38', '24'],
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

      const brandKey = String(drawerBrandText || '').toLowerCase();
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
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '916239379751'}?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
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
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '916239379751'}?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
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
      let currentV = parseInt(viewersEl.textContent || '8');
      const change = Math.random() > 0.5 ? 1 : -1;
      const newV = Math.max(8, Math.min(15, currentV + change));
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

async function renderRelatedProducts(product) {
  // Determine category name from product object
  const categoryName = product.category?.name || product.category || product.brandName || null;
  if (!categoryName) return;

  // Inject placeholder section below the main product
  const main = document.querySelector('main.product-page');
  if (!main) return;

  // Remove any existing related section (handles re-renders)
  document.getElementById('related-products-section')?.remove();

  const section = document.createElement('section');
  section.id = 'related-products-section';
  section.className = 'related-products-section';
  section.innerHTML = `
    <div class="related-products-inner">
      <h2 class="related-products-title">You May Also Like</h2>
      <div class="related-products-grid" id="related-products-grid">
        ${[...Array(4)].map(() => `
          <div class="related-skeleton">
            <div class="related-skeleton__img"></div>
            <div class="related-skeleton__line"></div>
            <div class="related-skeleton__line related-skeleton__line--short"></div>
          </div>`).join('')}
      </div>
    </div>
  `;
  main.appendChild(section);

  try {
    const related = await getRelatedProducts(categoryName, product.id, 8);
    const grid = document.getElementById('related-products-grid');
    if (!grid) return;

    if (!related || related.length === 0) {
      section.remove();
      return;
    }

    grid.innerHTML = related.map(p => createProductCard(p)).join('');

    // Re-attach wishlist toggle for the new cards
    grid.querySelectorAll('.pc-heart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  } catch (err) {
    console.warn('[Related Products] Failed to load:', err);
    section.remove();
  }
}
