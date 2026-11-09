/* ============================================
   Landing Page Logic
   ============================================ */
import { getAllProducts, getNewArrivals, getTrendingProducts, getCategories, getCustomerReviews, filterProducts } from './api.js';
import { timeSeededShuffle } from './shuffle.js';
import { addToCart, updateCartBadge } from './cart.js';
import { getNavbarHTML, getFooterHTML, createProductCard, showToast, formatCloudinaryUrl, initSearch, initMobileMenu } from './ui.js';
import { categoryCardHTML } from './shared/templates.js';
import { initWishlistSidebar, updateWishlistBadge } from './wishlist.js';
import { initCartSidebar } from './cart-sidebar.js';
import { initProfileDropdown } from './profile.js';
import { initLoginModalTrigger } from './login-modal.js';

// Render navbar & footer
document.getElementById('navbar-container').innerHTML = getNavbarHTML('home');
document.getElementById('footer-container').innerHTML = getFooterHTML();
initMobileMenu();
updateCartBadge();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initProfileDropdown();
initSearch();
initLoginModalTrigger();

function initHeroCarousel() {
  const carousel = document.getElementById('hero-carousel');
  initTrendingWidget();
  const track = carousel?.querySelector('.hero-carousel-track');
  const realSlides = Array.from(carousel?.querySelectorAll('.hero-slide') || []);
  const dots = Array.from(carousel?.querySelectorAll('.hero-carousel-dot') || []);
  const previousButton = carousel?.querySelector('.hero-carousel-arrow--prev');
  const nextButton = carousel?.querySelector('.hero-carousel-arrow--next');

  if (!carousel || !track || realSlides.length < 2) return;

  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[realSlides.length - 1].cloneNode(true);
  firstClone.classList.add('hero-slide--clone');
  lastClone.classList.add('hero-slide--clone');
  track.appendChild(firstClone);
  track.insertBefore(lastClone, realSlides[0]);

  const slides = Array.from(track.querySelectorAll('.hero-slide'));
  let trackIndex = 1;
  let autoTimer = null;
  let startX = 0;
  let dragDelta = 0;
  let isDragging = false;
  let isAnimating = false;

  const getRealIndex = () => (trackIndex - 1 + realSlides.length) % realSlides.length;

  const updateDots = () => {
    const realIndex = getRealIndex();
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === realIndex);
    });
  };

  const updateSlideClasses = () => {
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === trackIndex);
    });
  };

  const moveTrack = (animate = true) => {
    if (animate) isAnimating = true;
    track.style.transition = animate ? 'transform 1.25s cubic-bezier(0.25, 0.74, 0.28, 0.99)' : 'none';
    track.style.transform = `translate3d(-${trackIndex * 100}%, 0, 0)`;
  };

  const goToTrackIndex = (index, animate = true) => {
    if (isAnimating && (index < 1 || index > realSlides.length)) return;
    
    if (index < 0) index = 0;
    if (index > realSlides.length + 1) index = realSlides.length + 1;
    
    trackIndex = index;
    updateSlideClasses();
    updateDots();
    moveTrack(animate);
  };

  const goToRealSlide = (index) => {
    goToTrackIndex(index + 1);
  };

  const stopAutoSlide = () => {
    if (!autoTimer) return;
    clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    autoTimer = setInterval(() => goToTrackIndex(trackIndex + 1), 4500);
  };

  previousButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    goToTrackIndex(trackIndex - 1);
    startAutoSlide();
  });

  nextButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    goToTrackIndex(trackIndex + 1);
    startAutoSlide();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', (event) => {
      event.stopPropagation();
      goToRealSlide(index);
      startAutoSlide();
    });
  });

  carousel.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    isDragging = true;
    startX = event.clientX;
    dragDelta = 0;
    carousel.classList.add('is-dragging');
    stopAutoSlide();
    carousel.setPointerCapture?.(event.pointerId);
  });

  carousel.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    dragDelta = event.clientX - startX;
    track.style.transition = 'none';
    track.style.transform = `translate3d(calc(-${trackIndex * 100}% + ${dragDelta}px), 0, 0)`;
  });

  const finishDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('is-dragging');

    if (Math.abs(dragDelta) > 60) {
      goToTrackIndex(trackIndex + (dragDelta < 0 ? 1 : -1));
    } else if (Math.abs(dragDelta) < 5) {
      // It's a click!
      const currentSlide = slides[trackIndex];
      const href = currentSlide?.dataset?.href;
      if (href) {
        window.location.href = href;
      }
      goToTrackIndex(trackIndex);
    } else {
      goToTrackIndex(trackIndex);
    }

    startAutoSlide();
  };

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track) return;
    
    isAnimating = false;
    
    if (trackIndex === 0) {
      goToTrackIndex(realSlides.length, false);
    }

    if (trackIndex === realSlides.length + 1) {
      goToTrackIndex(1, false);
    }
  });

  carousel.addEventListener('pointerup', finishDrag);
  carousel.addEventListener('pointercancel', finishDrag);
  carousel.addEventListener('mouseleave', finishDrag);
  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);
  carousel.addEventListener('focusin', stopAutoSlide);
  carousel.addEventListener('focusout', startAutoSlide);

  goToTrackIndex(1, false);
  startAutoSlide();
}


// ── Load Categories from DB ──────────────────────────────
async function loadCategories() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  try {
    const categories = await getCategories();

    if (!categories || categories.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px 20px; color:#888;">
          <p style="font-size:15px;">No categories available yet.</p>
        </div>`;
      return;
    }

    // Markup shared with the SSR renderer; links use the canonical ?categories= URL.
    const categoryCards = categories.map(cat => categoryCardHTML(cat)).join('');

    grid.innerHTML = categoryCards;
  } catch (err) {
    console.error('Failed to load categories:', err);
    if (grid.querySelector('.category-card')) return; // keep server-rendered cards
    grid.innerHTML = '';   // hide the section gracefully on error
  }
}

// ── Trending Widget ──────────────────────────────────────
async function initTrendingWidget() {
  const widget = document.getElementById('hero-trending-widget');
  const track = document.getElementById('ht-track');
  if (!widget || !track) return;

  try {
    const trending = await getTrendingProducts();
    if (!trending || trending.length === 0) {
      return; // Leave it hidden if no trending products
    }

    // Build the slides HTML
    const formatPrice = (p) => '₹' + p.toLocaleString('en-IN');
    let slidesHTML = trending.map(p => {
      return `
        <div class="ht-slide">
          ${createProductCard(p)}
        </div>
      `;
    }).join('');

    track.innerHTML = slidesHTML;
    widget.style.display = 'block';

    let currentIndex = 0;
    const total = trending.length;
    let autoPlayTimer = null;

    const updateSlide = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % total;
      updateSlide();
    };

    const prevSlide = () => {
      currentIndex = (currentIndex - 1 + total) % total;
      updateSlide();
    };

    const resetTimer = () => {
      clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(nextSlide, 3000);
    };

    document.getElementById('ht-next').addEventListener('click', () => {
      nextSlide();
      resetTimer();
    });
    document.getElementById('ht-prev').addEventListener('click', () => {
      prevSlide();
      resetTimer();
    });

    // Start auto-play
    resetTimer();

    // Pause on hover
    widget.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
    widget.addEventListener('mouseleave', resetTimer);

  } catch (err) {
    console.error('Failed to load trending widget:', err);
  }
}

// ── Load New Arrivals ────────────────────────────────────
let arrivalsPage = 0;
const ARRIVALS_PAGE_SIZE = 16;
let hasMoreArrivals = true;

// renderedArrivalsCount tracks how many products are already in the DOM
// so "View More" only appends new cards without touching existing positions.
let renderedArrivalsCount = 0;

// allNewArrivals stores every loaded product in stable display order.
// Each batch is ordered once (12-hour seeded shuffle for in-stock items,
// out-of-stock pushed to the end) and never re-ordered afterward.
let allNewArrivals = [];

/**
 * Order a single batch for display:
 *  - In-stock items are time-seeded-shuffled (12-hour window, stable seed per page)
 *  - Out-of-stock items are appended after in-stock ones
 */
function orderArrivalsBatch(batch, page) {
  const inStock = batch.filter(p => p.inStockFlag !== false);
  const outOfStock = batch.filter(p => p.inStockFlag === false);
  return [...timeSeededShuffle(inStock, 1 + page), ...outOfStock];
}

async function loadArrivals() {
  const grid = document.getElementById('new-arrivals-grid');
  const moreWrap = document.getElementById('new-arrivals-more-wrap');
  const viewMoreBtn = document.getElementById('new-arrivals-view-more');

  try {
    arrivalsPage = 0;
    renderedArrivalsCount = 0;
    allNewArrivals = [];

    const products = await getNewArrivals(arrivalsPage, ARRIVALS_PAGE_SIZE);
    
    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px;">
          <p style="font-size:18px; font-weight:600;">No products yet</p>
          <p style="color:#666; margin-top:8px;">Products will appear here once the backend is running with data.</p>
        </div>
      `;
      return;
    }

    // Order this first batch once and lock it in
    const orderedFirst = orderArrivalsBatch(products, 0);
    allNewArrivals = orderedFirst;
    hasMoreArrivals = products.length === ARRIVALS_PAGE_SIZE;

    // Render the first batch from scratch
    grid.innerHTML = orderedFirst.map(createProductCard).join('');
    renderedArrivalsCount = orderedFirst.length;
    attachCardListeners(allNewArrivals);

    if (moreWrap) moreWrap.style.display = hasMoreArrivals ? 'block' : 'none';

    if (viewMoreBtn) {
      viewMoreBtn.addEventListener('click', async () => {
        viewMoreBtn.textContent = 'Loading...';
        viewMoreBtn.disabled = true;
        
        try {
          arrivalsPage++;
          const moreProducts = await getNewArrivals(arrivalsPage, ARRIVALS_PAGE_SIZE);
          
          if (moreProducts.length > 0) {
            // Order the new batch independently — existing cards are untouched
            const orderedBatch = orderArrivalsBatch(moreProducts, arrivalsPage);
            allNewArrivals = allNewArrivals.concat(orderedBatch);

            // Append only the new cards; do NOT rewrite the grid
            const fragment = document.createDocumentFragment();
            orderedBatch.forEach(p => {
              const wrapper = document.createElement('div');
              wrapper.innerHTML = createProductCard(p);
              while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
            });
            grid.appendChild(fragment);
            renderedArrivalsCount = allNewArrivals.length;
            attachCardListeners(allNewArrivals);
          }
          
          hasMoreArrivals = moreProducts.length === ARRIVALS_PAGE_SIZE;
          if (!hasMoreArrivals) {
            moreWrap.style.display = 'none';
          } else {
            viewMoreBtn.textContent = 'View More';
            viewMoreBtn.disabled = false;
          }
        } catch (err) {
          console.error("Failed to fetch more arrivals", err);
          viewMoreBtn.textContent = 'View More';
          viewMoreBtn.disabled = false;
        }
      });
    }
  } catch (error) {
    if (grid.querySelector('.product-card-link')) return; // keep server-rendered cards
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px;">
        <p style="font-size:18px; font-weight:600;">Couldn't load products</p>
        <p style="color:#666; margin-top:8px;">Make sure the backend services are running.</p>
        <button style="margin-top:16px; padding:10px 24px; border:1px solid #111; border-radius:4px; cursor:pointer; background:#111; color:#fff;" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

function attachCardListeners(products) {
  document.querySelectorAll('.product-card').forEach((card) => {
    const productId = card.dataset.productId;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Size chip selection
    const sizeChips = card.querySelectorAll('.product-card__size');
    sizeChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        sizeChips.forEach((c) => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
      });
    });

    // Add to cart
    const addBtn = card.querySelector('.product-card__add-to-cart');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const activeChip = card.querySelector('.chip--active');
        if (!activeChip) {
          showToast('Please select a size', 'error');
          return;
        }
        const variantId = activeChip.dataset.variantId;
        const variant = product.variants.find((v) => v.id === variantId);
        if (!variant) return;

        if (variant.stockQuantity <= 0) {
          showToast('This size is out of stock', 'error');
          return;
        }

        addToCart(product, variant);
        showToast(`${product.name} (${variant.size}) added to cart!`, 'success');
      });
    }
  });
}

initHeroCarousel();
loadCategories();
loadArrivals();
