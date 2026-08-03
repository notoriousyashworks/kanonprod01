/* ============================================
   Landing Page Logic
   ============================================ */
import { getAllProducts, getCategories, getCustomerReviews } from './api.js';
import { addToCart, updateCartBadge } from './cart.js';
import { getNavbarHTML, getFooterHTML, createProductCard, showToast, formatCloudinaryUrl, initSearch } from './ui.js';
import { initWishlistSidebar, updateWishlistBadge } from './wishlist.js';
import { initCartSidebar } from './cart-sidebar.js';
import { initProfileDropdown } from './profile.js';
import { initLoginModalTrigger } from './login-modal.js';

// Render navbar & footer
document.getElementById('navbar-container').innerHTML = getNavbarHTML('home');
document.getElementById('footer-container').innerHTML = getFooterHTML();
updateCartBadge();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initProfileDropdown();
initSearch();
initLoginModalTrigger();

function initHeroCarousel() {
  const carousel = document.getElementById('hero-carousel');
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
    track.style.transition = animate ? 'transform 1.25s cubic-bezier(0.25, 0.74, 0.28, 0.99)' : 'none';
    track.style.transform = `translate3d(-${trackIndex * 100}%, 0, 0)`;
  };

  const goToTrackIndex = (index, animate = true) => {
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
    autoTimer = setInterval(() => goToTrackIndex(trackIndex + 1), 1500);
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
    } else {
      goToTrackIndex(trackIndex);
    }

    startAutoSlide();
  };

  track.addEventListener('transitionend', () => {
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

    const categoryCards = categories.map(cat => `
      <a href="/products?category=${encodeURIComponent(cat.name)}" class="category-card">
        <div class="category-image-wrap">
          ${cat.imageUrl
            ? `<img src="${formatCloudinaryUrl(cat.imageUrl)}" alt="${cat.name}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#aaa;font-size:13px;">No image</div>`}
        </div>
        <div class="category-name">${cat.name}</div>
      </a>`).join('');

    grid.innerHTML = categoryCards + categoryCards;
  } catch (err) {
    console.error('Failed to load categories:', err);
    grid.innerHTML = '';   // hide the section gracefully on error
  }
}

// ── Load New Arrivals ────────────────────────────────────
let allNewArrivals = [];
let visibleArrivalsCount = 0;
const ARRIVALS_PAGE_SIZE = 8;

async function loadArrivals() {
  const grid = document.getElementById('new-arrivals-grid');
  const exploreBtn = document.getElementById('explore-all-btn');
  try {
    const products = await getAllProducts();
    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div class="text-center" style="grid-column: 1/-1; padding: 60px 20px;">
          <p class="headline-md">No products yet</p>
          <p class="body-md text-muted mt-sm">Products will appear here once the backend is running with data.</p>
        </div>
      `;
      if (exploreBtn) exploreBtn.style.display = 'none';
      return;
    }

    allNewArrivals = products.slice(0, 16);
    visibleArrivalsCount = Math.min(ARRIVALS_PAGE_SIZE, allNewArrivals.length);

    const initialSlice = allNewArrivals.slice(0, visibleArrivalsCount);
    const arrivalCards = initialSlice.map(createProductCard).join('');
    grid.innerHTML = arrivalCards + arrivalCards;
    attachCardListeners(initialSlice);

    if (exploreBtn) {
      exploreBtn.style.display = 'none';
    }
  } catch (error) {
    grid.innerHTML = `
      <div class="text-center" style="grid-column: 1/-1; padding: 60px 20px;">
        <p class="headline-md">Couldn't load products</p>
        <p class="body-md text-muted mt-sm">Make sure the backend services are running on port 8080.</p>
        <button class="btn btn--secondary mt-md" onclick="location.reload()">Retry</button>
      </div>
    `;
    if (exploreBtn) exploreBtn.style.display = 'none';
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
loadReviews();

async function loadReviews() {
  const container = document.querySelector('.reviews-carousel');
  if (!container) return;
  
  try {
    const reviews = await getCustomerReviews();
    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<p style="text-align:center;width:100%;color:#888;">No reviews yet.</p>';
      return;
    }
    
    // Create arrows
    const prevBtn = `<button class="carousel-btn carousel-btn--prev">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
    </button>`;
    const nextBtn = `<button class="carousel-btn carousel-btn--next">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    </button>`;
    
    const reviewCards = reviews.map(r => `
      <img class="review-card" src="${formatCloudinaryUrl(r.imageUrl)}" alt="Customer Review" style="object-fit:cover;border-radius:12px;">
    `).join('');
    
    container.innerHTML = prevBtn + reviewCards + nextBtn;
    
  } catch(e) {
    console.error('Failed to load reviews:', e);
  }
}
