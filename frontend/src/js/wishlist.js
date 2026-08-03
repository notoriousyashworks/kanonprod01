/* ============================================
   Wishlist State Management
   ============================================ */
import { showToast } from './ui.js';

const WISHLIST_STORAGE_KEY = 'kicksaura_wishlist';

export function getWishlistItems() {
  const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveWishlist(items) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

export function isWishlisted(productId) {
  const items = getWishlistItems();
  return items.some(item => item.id === productId);
}

export function toggleWishlistItem(productOrId) {
  let product = productOrId;
  if (typeof productOrId === 'string') {
    product = window._allProducts?.find(p => p.id === productOrId);
    if (!product) {
      const card = document.querySelector(`[data-product-id="${productOrId}"]`);
      if (card) {
        product = {
          id: productOrId,
          name: card.querySelector('.pc-name')?.textContent || 'Product',
          imageUrls: [card.querySelector('img')?.src],
          discountedPrice: parseFloat(card.querySelector('.pc-price')?.textContent?.replace(/[^0-9.]/g, '') || '0')
        };
      } else {
        product = { id: productOrId };
      }
    }
  }

  let items = getWishlistItems();
  const index = items.findIndex(item => item.id === product.id);

  let isAdded = false;
  if (index > -1) {
    items.splice(index, 1);
  } else {
    items.push({
      id: product.id,
      name: product.name,
      image: product.imageUrls?.[0] || '/images/products/redjordanface1.png',
      price: product.discountedPrice || product.basePrice,
      originalPrice: product.discountedPrice ? product.basePrice : null
    });
    isAdded = true;
  }

  saveWishlist(items);
  updateWishlistBadge();
  renderWishlistSidebar();
  
  if (isAdded) {
    showToast('Added to wishlist!', 'success');
  } else {
    showToast('Removed from wishlist.', 'info');
  }
  
  return isAdded;
}

export function updateWishlistBadge() {
  const items = getWishlistItems();
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.textContent = items.length;
    badge.style.display = items.length > 0 ? 'flex' : 'none';
  }
}

export function renderWishlistSidebar() {
  const container = document.getElementById('wishlist-items-container');
  if (!container) return;

  const items = getWishlistItems();
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: 64px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 16px;">🤍</div>
        <p style="font-weight: 600; color: #333; font-size: 16px;">Your wishlist is empty</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const imageUrl = item.image || '';
    const currentP = Number(item.price || 0);
    const origP = Number(item.originalPrice || 0);
    const unitPriceFmt = `Rs. ${currentP.toLocaleString('en-IN')}.00`;
    const origPriceFmt = (origP && origP > currentP) ? `Rs. ${origP.toLocaleString('en-IN')}.00` : null;

    const priceRowHTML = origPriceFmt
      ? `<span style="text-decoration: line-through; color: #888; font-size: 13px; margin-right: 6px;">${origPriceFmt}</span><span style="font-weight: 700; color: #111; font-size: 15px;">${unitPriceFmt}</span>`
      : `<span style="font-weight: 700; color: #111; font-size: 15px;">${unitPriceFmt}</span>`;

    return `
      <div class="wishlist-sidebar-item modern-cart-item" data-id="${item.id}" style="cursor: pointer; position: relative; transition: background 0.2s; padding: 14px 12px; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; gap: 14px;">
        <div class="cart-sidebar-img modern-item-img" style="flex: 0 0 74px; width: 74px; height: 74px; border-radius: 12px; overflow: hidden; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain;" />` : `<span style="font-size: 24px;">👟</span>`}
        </div>
        
        <div class="cart-sidebar-details modern-item-details" style="flex: 1; min-width: 0;">
          <p class="modern-item-name" style="font-size: 15px; font-weight: 700; color: #111; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</p>
          <p class="modern-item-unit-meta" style="margin: 0 0 10px;">${priceRowHTML}</p>
          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <span style="font-size: 12.5px; font-weight: 600; color: #2563eb; display: flex; align-items: center; gap: 4px;">
              <span>View Product →</span>
            </span>
            
            <button class="modern-trash-btn remove-wishlist-btn" data-id="${item.id}" title="Remove from wishlist" style="background: #fff; border: 1px solid #eee; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666; transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach remove listeners
  container.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleWishlistItem({ id });
      
      const cardHeartBtn = document.querySelector(`.product-card-new[data-product-id="${id}"] .pc-heart-btn`);
      if (cardHeartBtn) {
        cardHeartBtn.classList.remove('active');
        const svg = cardHeartBtn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
        }
      }
    });
  });

  // Attach click listener to redirect to product details page
  container.querySelectorAll('.wishlist-sidebar-item').forEach(itemEl => {
    itemEl.addEventListener('click', (e) => {
      if (e.target.closest('.remove-wishlist-btn')) return;
      const id = itemEl.dataset.id;
      if (id) {
        window.location.href = `/product-details?id=${id}`;
      }
    });
  });
}

// Global hook to open/close sidebar
export function initWishlistSidebar() {
  const sidebar = document.getElementById('wishlist-sidebar');
  const overlay = document.getElementById('wishlist-overlay');
  const trigger = document.getElementById('wishlist-trigger');
  const closeBtn = document.getElementById('close-wishlist');

  if (!sidebar || !trigger) return;

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    renderWishlistSidebar();
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openSidebar();
  });

  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);
}

window.toggleWishlistItem = toggleWishlistItem;
window.isWishlisted = isWishlisted;
