/* ============================================
   Products Page — Search + Filter Engine
   ============================================ */
import { filterProducts, getCategories, getBrands, getAllProducts } from './api.js';
import { updateCartBadge } from './cart.js';
import { getNavbarHTML, getFooterHTML, createProductCard, showToast, initSearch, initMobileMenu } from './ui.js';
import { initWishlistSidebar, updateWishlistBadge } from './wishlist.js';
import { initCartSidebar } from './cart-sidebar.js';
import { initProfileDropdown } from './profile.js';
import { initLoginModalTrigger } from './login-modal.js';

// ── Bootstrap UI ──────────────────────────────────────────
document.getElementById('navbar-container').innerHTML = getNavbarHTML('products');
document.getElementById('footer-container').innerHTML = getFooterHTML();
initMobileMenu();
updateCartBadge();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initProfileDropdown();
initLoginModalTrigger();
initSearch();

/* ============================================================
   UNIFIED STATE
   All filter/search values live here. URL is the source of truth on load.
   ============================================================ */
const PRICE_MIN_DEFAULT = 0;
const PRICE_MAX_DEFAULT = 35000;
const PRODUCTS_BATCH_SIZE = 16;
let currentPage = 0;
let totalPages = 0;
let totalElements = 0;
let allLoadedProducts = [];
let isLoadingMore = false;

const state = {
  searchQuery: '',
  categories: [],   // string[]
  brands: [],       // string[]
  sizes: [],        // string[]
  minPrice: PRICE_MIN_DEFAULT,
  maxPrice: PRICE_MAX_DEFAULT,
};

// ── Read initial state from URL ────────────────────────────
function readStateFromURL() {
  const p = new URLSearchParams(window.location.search);

  state.searchQuery = p.get('search') || '';
  state.categories  = p.get('categories')  ? p.get('categories').split(',').filter(Boolean)  : [];
  state.brands      = p.get('brands')      ? p.get('brands').split(',').filter(Boolean)      : [];
  state.sizes       = p.get('sizes')       ? p.get('sizes').split(',').filter(Boolean)       : [];
  state.minPrice    = p.has('minPrice') ? Number(p.get('minPrice')) : PRICE_MIN_DEFAULT;
  state.maxPrice    = p.has('maxPrice') ? Number(p.get('maxPrice')) : PRICE_MAX_DEFAULT;

  // Legacy: single ?category=... param (from homepage card clicks)
  const legacyCategory = p.get('category');
  if (legacyCategory && legacyCategory !== 'all' && !state.categories.includes(legacyCategory)) {
    state.categories.push(legacyCategory);
  }
}

// ── Write state to URL (pushState for back/forward support) ─
function pushStateToURL() {
  const p = new URLSearchParams();
  if (state.searchQuery) p.set('search', state.searchQuery);
  if (state.categories.length)  p.set('categories', state.categories.join(','));
  if (state.brands.length)      p.set('brands', state.brands.join(','));
  if (state.sizes.length)       p.set('sizes', state.sizes.join(','));
  if (state.minPrice !== PRICE_MIN_DEFAULT) p.set('minPrice', state.minPrice);
  if (state.maxPrice !== PRICE_MAX_DEFAULT) p.set('maxPrice', state.maxPrice);

  const newUrl = `${window.location.pathname}${p.toString() ? '?' + p.toString() : ''}`;
  history.pushState(null, '', newUrl);
}

// Restore state when user navigates back/forward
window.addEventListener('popstate', () => {
  readStateFromURL();
  syncSidebarCheckboxes();
  syncPriceSlider();
  loadAndRender();
});



/* ============================================================
   ACTIVE FILTER CHIPS
   ============================================================ */
function renderActiveChips() {
  const row = document.getElementById('active-chips-row');
  if (!row) return;

  const chips = [];

  // Search chip removed as per user request.

  // Category chips
  state.categories.forEach(cat => {
    chips.push({
      label: cat,
      onRemove: () => {
        state.categories = state.categories.filter(c => c !== cat);
        syncSidebarCheckboxes();
        triggerLoad();
      },
    });
  });

  // Brand chips
  state.brands.forEach(brand => {
    chips.push({
      label: brand,
      onRemove: () => {
        state.brands = state.brands.filter(b => b !== brand);
        syncSidebarCheckboxes();
        triggerLoad();
      },
    });
  });

  // Size chips
  state.sizes.forEach(size => {
    chips.push({
      label: `Size: ${size}`,
      onRemove: () => {
        state.sizes = state.sizes.filter(s => s !== size);
        syncSidebarCheckboxes();
        triggerLoad();
      },
    });
  });

  // Price chip (only when non-default)
  if (state.minPrice !== PRICE_MIN_DEFAULT || state.maxPrice !== PRICE_MAX_DEFAULT) {
    chips.push({
      label: `₹${state.minPrice.toLocaleString('en-IN')} – ₹${state.maxPrice.toLocaleString('en-IN')}`,
      onRemove: () => {
        state.minPrice = PRICE_MIN_DEFAULT;
        state.maxPrice = PRICE_MAX_DEFAULT;
        syncPriceSlider();
        triggerLoad();
      },
    });
  }

  if (chips.length === 0) {
    row.innerHTML = '';
    return;
  }

  row.innerHTML = chips
    .map(
      (chip, i) => `
      <button class="filter-chip filter-chip--active" data-chip-index="${i}">
        ${chip.label}
        <span class="filter-chip__remove">✕</span>
      </button>`
    )
    .join('');

  row.querySelectorAll('.filter-chip').forEach((el, i) => {
    el.addEventListener('click', () => chips[i].onRemove());
  });
}

/* ============================================================
   PAGE TITLE
   ============================================================ */
function updatePageTitle() {
  const title = document.getElementById('products-page-title');
  if (!title) return;

  if (state.searchQuery) {
    title.textContent = 'Search Results';
  } else if (state.categories.length === 1) {
    title.textContent = state.categories[0];
  } else if (state.categories.length > 1) {
    title.textContent = 'Multiple Categories';
  } else {
    title.textContent = 'All Products';
  }
}

/* ============================================================
   SIDEBAR — OVERLAY / TOGGLE
   ============================================================ */
const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
const closeSidebarBtn  = document.getElementById('close-sidebar-btn');
const productsSidebar  = document.getElementById('products-sidebar');
const filterOverlay    = document.getElementById('filter-overlay');

function openSidebar() {
  productsSidebar?.classList.add('active');
  filterOverlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  productsSidebar?.classList.remove('active');
  filterOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

toggleFiltersBtn?.addEventListener('click', openSidebar);
closeSidebarBtn?.addEventListener('click', closeSidebar);
filterOverlay?.addEventListener('click', closeSidebar);

/* ============================================================
   SIDEBAR — CATEGORIES
   ============================================================ */
async function initSidebarCategories() {
  try {
    const cats = await getCategories();
    const catGroup = document.getElementById('category-filter-group');
    if (!catGroup || !cats?.length) return;

    catGroup.innerHTML = cats.map(c => {
      const checked = state.categories.some(ac => ac.toLowerCase() === c.name.toLowerCase());
      return `
        <label class="custom-checkbox">
          <input type="checkbox" ${checked ? 'checked' : ''} data-cat="${c.name}" />
          <span class="checkmark"></span>
          ${c.name}
        </label>`;
    }).join('');
  } catch (e) {
    console.error('Could not load categories', e);
  }

  document.querySelectorAll('#category-filter-group input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', e => {
      const name = e.target.dataset.cat;
      if (e.target.checked) {
        if (!state.categories.includes(name)) state.categories.push(name);
      } else {
        state.categories = state.categories.filter(c => c !== name);
      }
      triggerLoad();
    });
  });
}

/* ============================================================
   SIDEBAR — BRANDS
   ============================================================ */
async function initSidebarBrands() {
  try {
    const brands = await getBrands();
    const brandGroup = document.getElementById('brand-filter-group');
    if (!brandGroup) return;

    if (!brands?.length) {
      brandGroup.innerHTML = '';
      return;
    }

    brandGroup.innerHTML = brands.map(b => {
      const checked = state.brands.some(ab => ab.toLowerCase() === b.name.toLowerCase());
      return `
        <label class="custom-checkbox">
          <input type="checkbox" ${checked ? 'checked' : ''} data-brand="${b.name}" />
          <span class="checkmark"></span>
          ${b.name}
        </label>`;
    }).join('');
  } catch (e) {
    console.error('Could not load brands', e);
  }

  document.querySelectorAll('#brand-filter-group input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', e => {
      const name = e.target.dataset.brand;
      if (e.target.checked) {
        if (!state.brands.includes(name)) state.brands.push(name);
      } else {
        state.brands = state.brands.filter(b => b !== name);
      }
      triggerLoad();
    });
  });
}

/* ============================================================
   SIDEBAR — SIZE (derived from product variants)
   ============================================================ */
async function initSidebarSizes() {
  try {
    const products = await getAllProducts();
    const sizeSet = new Set();

    products.forEach(p => {
      (p.variants || []).forEach(v => {
        if (v.size) sizeSet.add(v.size);
      });
    });

    // Sort sizes: numeric first (by number), then alpha
    const sizes = [...sizeSet].sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    const sizeGroup = document.getElementById('size-filter-group');
    if (!sizeGroup || !sizes.length) return;

    sizeGroup.innerHTML = `<div class="size-grid">${
      sizes.map(sz => {
        const checked = state.sizes.includes(sz);
        return `
          <label class="size-chip-label">
            <input type="checkbox" ${checked ? 'checked' : ''} data-size="${sz}" />
            <span class="size-chip-value">${sz}</span>
          </label>`;
      }).join('')
    }</div>`;
  } catch (e) {
    console.error('Could not load sizes', e);
  }

  document.querySelectorAll('#size-filter-group input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', e => {
      const sz = e.target.dataset.size;
      if (e.target.checked) {
        if (!state.sizes.includes(sz)) state.sizes.push(sz);
      } else {
        state.sizes = state.sizes.filter(s => s !== sz);
      }
      triggerLoad();
    });
  });
}

/* ============================================================
   SIDEBAR — PRICE SLIDER
   ============================================================ */
function updateSliderUI() {
  const minSlider   = document.getElementById('price-slider-min');
  const maxSlider   = document.getElementById('price-slider-max');
  const priceDisplay = document.getElementById('price-display');
  const track       = document.querySelector('.range-track');

  if (!minSlider || !maxSlider || !priceDisplay || !track) return;

  let minVal = parseInt(minSlider.value, 10);
  let maxVal = parseInt(maxSlider.value, 10);

  if (minVal >= maxVal) {
    minVal = maxVal - parseInt(minSlider.step, 10);
    minSlider.value = minVal;
  }

  priceDisplay.textContent = `₹${minVal.toLocaleString('en-IN')} - ₹${maxVal.toLocaleString('en-IN')}`;
  state.minPrice = minVal;
  state.maxPrice = maxVal;

  const minPercent = (minVal / parseInt(minSlider.max, 10)) * 100;
  const maxPercent = (maxVal / parseInt(maxSlider.max, 10)) * 100;
  track.style.left  = `${minPercent}%`;
  track.style.width = `${maxPercent - minPercent}%`;
}

function syncPriceSlider() {
  const minSlider = document.getElementById('price-slider-min');
  const maxSlider = document.getElementById('price-slider-max');
  if (minSlider) minSlider.value = state.minPrice;
  if (maxSlider) maxSlider.value = state.maxPrice;
  updateSliderUI();
}

function initPriceSlider() {
  const minSlider = document.getElementById('price-slider-min');
  const maxSlider = document.getElementById('price-slider-max');
  if (!minSlider || !maxSlider) return;

  syncPriceSlider();

  let priceDebounce;
  const onPriceChange = () => {
    updateSliderUI();
    clearTimeout(priceDebounce);
    priceDebounce = setTimeout(triggerLoad, 400);
  };

  minSlider.addEventListener('input', onPriceChange);
  maxSlider.addEventListener('input', onPriceChange);
}

/* ============================================================
   SYNC SIDEBAR CHECKBOXES → matches state
   Called when state is changed externally (chip removal, back/forward)
   ============================================================ */
function syncSidebarCheckboxes() {
  document.querySelectorAll('#category-filter-group input[type="checkbox"]').forEach(cb => {
    cb.checked = state.categories.includes(cb.dataset.cat);
  });
  document.querySelectorAll('#brand-filter-group input[type="checkbox"]').forEach(cb => {
    cb.checked = state.brands.includes(cb.dataset.brand);
  });
  document.querySelectorAll('#size-filter-group input[type="checkbox"]').forEach(cb => {
    cb.checked = state.sizes.includes(cb.dataset.size);
  });
}

/* ============================================================
   NAVBAR SEARCH INPUT WIRING
   ============================================================ */
function initProductsSearch() {
  const navInput = document.getElementById('nav-search-input');
  if (!navInput) return;

  // Populate from state on load
  if (state.searchQuery) {
    navInput.value = state.searchQuery;
    navInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  let debounce;
  navInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.searchQuery = navInput.value.trim();
      triggerLoad();
    }, 300);
  });

  navInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(debounce);
      state.searchQuery = navInput.value.trim();
      triggerLoad();
    }
  });
}

/* ============================================================
   CORE LOAD + RENDER
   ============================================================ */

// Cache of trending products for empty-state fallback
let trendingCache = null;

async function getTrendingProducts() {
  if (trendingCache) return trendingCache;
  try {
    const all = await getAllProducts();
    // Use newest 8 products as "trending"
    trendingCache = (all || []).slice(0, 8);
  } catch {
    trendingCache = [];
  }
  return trendingCache;
}

let isLoading = false;

async function fetchPage(page) {
    const pageData = await filterProducts({
      query: state.searchQuery,
      categories: state.categories,
      brands:     state.brands,
      sizes:      state.sizes,
      minPrice:   state.minPrice,
      maxPrice:   state.maxPrice,
    }, page, PRODUCTS_BATCH_SIZE);
    return pageData;
}

function renderProducts(grid) {
  const hasMore = currentPage + 1 < totalPages;

  grid.innerHTML = `
    ${allLoadedProducts.map(createProductCard).join('')}
    ${hasMore ? `
      <div class="products-view-more">
        <button class="products-view-more-btn" type="button" ${isLoadingMore ? 'disabled' : ''}>
          ${isLoadingMore ? 'Loading...' : 'View More'}
          ${!isLoadingMore ? `<span>${Math.min(PRODUCTS_BATCH_SIZE, totalElements - allLoadedProducts.length)} more</span>` : ''}
        </button>
      </div>
    ` : ''}
  `;

  grid.querySelector('.products-view-more-btn')?.addEventListener('click', () => {
    if (!isLoadingMore) {
      loadMore();
    }
  });
}

async function loadMore() {
  if (isLoadingMore || currentPage + 1 >= totalPages) return;
  isLoadingMore = true;
  const grid = document.getElementById('products-grid');
  renderProducts(grid); // Update button to Loading...
  
  try {
    const nextPage = currentPage + 1;
    const pageData = await fetchPage(nextPage);
    allLoadedProducts = [...allLoadedProducts, ...(pageData.content || [])];
    currentPage = pageData.number;
    totalPages = pageData.totalPages;
    totalElements = pageData.totalElements;
    renderProducts(grid);
  } catch(e) {
    console.error(e);
  } finally {
    isLoadingMore = false;
  }
}

async function loadAndRender() {
  if (isLoading) return;
  isLoading = true;

  const grid          = document.getElementById('products-grid');
  const resultsCount  = document.getElementById('results-count');

  // Show branded loader
  grid.innerHTML = `
    <div style="grid-column: 1/-1;">
      <div class="ka-loader">
        <div class="ka-loader__badge">
          <div class="ka-loader__wordmark">KICKS<br>AURA</div>
        </div>
        <span class="ka-loader__text">Loading products…</span>
      </div>
    </div>`;

  // Update page title & chips immediately (optimistic)
  updatePageTitle();
  renderActiveChips();
  pushStateToURL();

  try {
    // Fetch from backend with structural filters and search query (server-side)
    currentPage = 0;
    allLoadedProducts = [];
    
    const pageData = await fetchPage(currentPage);
    allLoadedProducts = pageData.content || [];
    totalPages = pageData.totalPages || 0;
    totalElements = pageData.totalElements || 0;

    resultsCount.textContent = `${totalElements} product${totalElements !== 1 ? 's' : ''} found`;

    if (totalElements === 0) {
      // Show no-results + trending
      const trending = await getTrendingProducts();

      // Just show trending always when no results
      const trendingHTML = trending.length > 0
        ? `
          <p class="trending-section-title">Trending Products</p>
          <div class="products-grid">${trending.map(createProductCard).join('')}</div>
        `
        : '';

      grid.innerHTML = `
        <div class="no-results-container" style="grid-column: 1/-1;">
          <div class="no-results-hero">
            <p class="no-results-title">No products found</p>
            <p class="no-results-subtitle">We couldn't find any products matching your search.</p>
          </div>
          ${trendingHTML}
        </div>
      `;
    } else {
      renderProducts(grid);
    }

  } catch (err) {
    console.error('loadAndRender error:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state__icon">⚠️</div>
        <p class="headline-md">Couldn't load products</p>
        <p class="body-md text-muted mt-sm">Make sure the backend services are running.</p>
        <button class="btn btn--secondary mt-md" onclick="location.reload()">Retry</button>
      </div>`;
  } finally {
    isLoading = false;
  }
}

/* ============================================================
   TRIGGER — debounced unified entry point
   ============================================================ */
let triggerDebounce;
function triggerLoad() {
  clearTimeout(triggerDebounce);
  triggerDebounce = setTimeout(loadAndRender, 0);
}

/* ============================================================
   BOOT
   ============================================================ */
readStateFromURL();

Promise.all([
  initSidebarCategories(),
  initSidebarBrands(),
  initSidebarSizes(),
]).then(() => {
  initPriceSlider();
  initProductsSearch();
  loadAndRender();
});
