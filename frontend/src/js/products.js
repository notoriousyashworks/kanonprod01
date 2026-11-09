/* ============================================
   Products Page — Search + Filter Engine
   ============================================ */
import { filterProducts, getCategories, getBrands, getAllProducts, getNewArrivalsPage, getTrendingProducts as apiGetTrendingProducts } from './api.js';
import { timeSeededShuffle } from './shuffle.js';
import { activeChipsHTML, breadcrumbsHTML, categoryHref, slugify, viewMoreHTML } from './shared/templates.js';
import { categoryCopyHTML } from './shared/category-content.js';
import { parseCategoryPath, findCategoryBySlug, listingTitle } from './shared/seo.js';
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
  minPrice: PRICE_MIN_DEFAULT,
  maxPrice: PRICE_MAX_DEFAULT,
  trending: false,
  newArrivals: false, // /new-arrivals
  startPage: 0,       // from ?page=N (crawlable pagination), 0-based
};

// Set when /category/<slug> has to be resolved against the category list.
let pendingCategorySlug = null;
let knownCategories = [];

function readSsrListingCategory() {
  try {
    const data = JSON.parse(document.getElementById('ka-ssr-data')?.textContent || 'null');
    return data?.listing?.category || null;
  } catch {
    return null;
  }
}

// ── Read initial state from URL ────────────────────────────
function readStateFromURL() {
  const p = new URLSearchParams(window.location.search);

  state.searchQuery = p.get('search') || '';
  state.categories  = p.get('categories')  ? p.get('categories').split(',').filter(Boolean)  : [];
  state.brands      = p.get('brands')      ? p.get('brands').split(',').filter(Boolean)      : [];
  state.minPrice    = p.has('minPrice') ? Number(p.get('minPrice')) : PRICE_MIN_DEFAULT;
  state.maxPrice    = p.has('maxPrice') ? Number(p.get('maxPrice')) : PRICE_MAX_DEFAULT;
  state.trending    = p.get('trending') === 'true';
  state.newArrivals = window.location.pathname === '/new-arrivals';
  const rawPage = Number(p.get('page'));
  state.startPage = Number.isInteger(rawPage) && rawPage > 1 ? rawPage - 1 : 0;

  // Clean category URL: /category/<slug>
  const slug = parseCategoryPath(window.location.pathname);
  if (slug) {
    const known = readSsrListingCategory();
    const fromList = findCategoryBySlug(knownCategories, slug);
    if (fromList) {
      state.categories = [fromList.name];
    } else if (known && slugify(known) === slug) {
      state.categories = [known];
    } else {
      pendingCategorySlug = slug;
    }
  }

  // Legacy: single ?category=... param (from homepage card clicks)
  const legacyCategory = p.get('category');
  if (legacyCategory && legacyCategory !== 'all' && !state.categories.includes(legacyCategory)) {
    state.categories.push(legacyCategory);
  }
}

// ── Write state to URL (pushState for back/forward support) ─
let isInitialLoad = true;
function pushStateToURL() {
  const p = new URLSearchParams();
  if (state.searchQuery) p.set('search', state.searchQuery);
  if (state.categories.length)  p.set('categories', state.categories.join(','));
  if (state.brands.length)      p.set('brands', state.brands.join(','));
  if (state.minPrice !== PRICE_MIN_DEFAULT) p.set('minPrice', state.minPrice);
  if (state.maxPrice !== PRICE_MAX_DEFAULT) p.set('maxPrice', state.maxPrice);
  if (state.trending) p.set('trending', 'true');

  // Keep shareable URLs clean: one category and nothing else has its own page.
  const onlyOneCategory = state.categories.length === 1 && [...p.keys()].every(k => k === 'categories');
  let path = '/products';
  if (onlyOneCategory) {
    path = categoryHref(state.categories[0]);
    p.delete('categories');
  } else if (state.newArrivals && !p.toString()) {
    path = '/new-arrivals';
  }
  if (state.startPage > 0) p.set('page', state.startPage + 1);

  const newUrl = `${path}${p.toString() ? '?' + p.toString() : ''}`;
  // On the very first load the URL is already correct — replace instead of push
  // so the browser doesn't create a duplicate history entry (which forces the
  // user to press Back twice to leave the page).
  if (isInitialLoad) {
    history.replaceState(null, '', newUrl);
    isInitialLoad = false;
  } else {
    history.pushState(null, '', newUrl);
  }
}

// Restore state when user navigates back/forward
window.addEventListener('popstate', () => {
  isInitialLoad = true; // treat restored state as a fresh load (replaceState)
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

  // Trending chip (if trending is active)
  if (state.trending) {
    chips.push({
      label: 'Trending 🔥',
      onRemove: () => {
        state.trending = false;
        triggerLoad();
      }
    });
  }

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

  row.innerHTML = activeChipsHTML(chips.map(c => c.label)); // markup shared with SSR

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

  document.title = listingTitle({
    indexable: true,
    newArrivals: state.newArrivals,
    category: state.categories.length === 1 ? state.categories[0] : null,
  }, state.startPage + 1);

  const crumbs = document.getElementById('listing-breadcrumbs');
  if (crumbs) {
    const current = state.newArrivals ? 'New Arrivals'
      : state.categories.length === 1 && !state.searchQuery ? state.categories[0]
      : null;
    crumbs.innerHTML = current
      ? breadcrumbsHTML([{ name: 'Home', href: '/' }, { name: 'All Products', href: '/products' }, { name: current }])
      : '';
  }

  const copy = document.getElementById('category-copy');
  if (copy) {
    copy.innerHTML = state.categories.length === 1 && state.startPage === 0 && !state.searchQuery
      ? categoryCopyHTML(slugify(state.categories[0]), state.categories[0])
      : '';
  }

  if (state.newArrivals) {
    title.textContent = 'New Arrivals';
  } else if (state.trending) {
    title.textContent = 'Trending Products';
  } else if (state.searchQuery) {
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
    knownCategories = cats || [];
    if (pendingCategorySlug) {
      const match = findCategoryBySlug(cats, pendingCategorySlug);
      if (match) state.categories = [match.name];
      pendingCategorySlug = null;
    }
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
    const trending = await apiGetTrendingProducts();
    trendingCache = (trending || []).slice(0, 8);
  } catch {
    trendingCache = [];
  }
  return trendingCache;
}

let isLoading = false;

async function fetchPage(page) {
    if (state.newArrivals) {
      return getNewArrivalsPage(page, PRODUCTS_BATCH_SIZE);
    }
    if (state.trending) {
      // If trending is explicitly requested via filters/URL
      const trendingAll = await getTrendingProducts();
      return {
        content: trendingAll,
        number: 0,
        totalPages: 1,
        totalElements: trendingAll.length
      };
    }

    const pageData = await filterProducts({
      query: state.searchQuery,
      categories: state.categories,
      brands:     state.brands,
      minPrice:   state.minPrice,
      maxPrice:   state.maxPrice,
    }, page, PRODUCTS_BATCH_SIZE);
    return pageData;
}

// Shuffle in-stock ones (12-hour seed), out-of-stock last — within ONE batch only.
function orderBatch(batch, page) {
  const inStock = batch.filter(p => p.inStockFlag !== false);
  const outOfStock = batch.filter(p => p.inStockFlag === false);
  return [...timeSeededShuffle(inStock, 2 + page), ...outOfStock];
}

function nextPageHref() {
  const q = new URLSearchParams(window.location.search);
  q.set('page', currentPage + 2);
  return `${window.location.pathname}?${q}`;
}

function renderProducts(grid) {
  const hasMore = currentPage + 1 < totalPages;

  // allLoadedProducts is already ordered per batch (see orderBatch), so
  // earlier cards never move when "View More" appends the next batch.
  const sortedProducts = allLoadedProducts;

  grid.innerHTML = `
    ${sortedProducts.map(createProductCard).join('')}
    ${hasMore ? viewMoreHTML(nextPageHref(), { loading: isLoadingMore }) : ''}
  `;

  grid.querySelector('.products-view-more-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
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
    allLoadedProducts = [...allLoadedProducts, ...orderBatch(pageData.content || [], nextPage)];
    currentPage = pageData.number;
    totalPages = pageData.totalPages;
    totalElements = pageData.totalElements;
  } catch(e) {
    console.error(e);
  } finally {
    isLoadingMore = false;
    renderProducts(grid); // Re-render after reset so button shows correctly
  }
}

let isFirstLoad = true;

async function loadAndRender() {
  if (isLoading) return;
  isLoading = true;

  const grid          = document.getElementById('products-grid');
  const resultsCount  = document.getElementById('results-count');

  // On first load the server may already have rendered the first batch of
  // cards (same API call, same ordering). Keep them on screen instead of
  // flashing the loader, and never replace them with an error state.
  const keepSsrGrid = isFirstLoad && !!grid.querySelector('.product-card-link');
  isFirstLoad = false;

  // Show branded loader
  if (!keepSsrGrid) grid.innerHTML = `
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
    currentPage = state.startPage;
    allLoadedProducts = [];
    
    const pageData = await fetchPage(currentPage);
    allLoadedProducts = orderBatch(pageData.content || [], currentPage);
    totalPages = pageData.totalPages || 0;
    totalElements = pageData.totalElements || 0;

    resultsCount.textContent = '';

    if (totalElements === 0) {
      const trending = await getTrendingProducts();

      const trendingHTML = trending.length > 0
        ? `
          <p class="trending-section-title">Trending Products</p>
          <div class="products-grid">${trending.map(createProductCard).join('')}</div>
        `
        : '';

      // If a category filter is active and returned nothing → Coming Soon
      const isCategoryFilter = state.categories.length > 0;

      grid.innerHTML = `
        <div class="no-results-container" style="grid-column: 1/-1;">
          <div class="no-results-hero">
            ${isCategoryFilter
              ? `<p class="no-results-title" style="font-size: 2rem; color: #ff3333; margin-bottom: 8px;">Coming Soon!</p>
                 <p class="no-results-subtitle">We are currently working on adding products to this category.</p>`
              : `<p class="no-results-title">No products found</p>
                 <p class="no-results-subtitle">We couldn't find any products matching your search.</p>`
            }
          </div>
          ${trendingHTML}
        </div>
      `;
    } else {
      renderProducts(grid);
    }

  } catch (err) {
    console.error('loadAndRender error:', err);
    if (keepSsrGrid) return; // keep server-rendered products
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
  // Any filter change leaves the /new-arrivals view and starts from the first batch.
  state.newArrivals = false;
  state.startPage = 0;
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
]).then(() => {
  initPriceSlider();
  initProductsSearch();
  loadAndRender();
});
