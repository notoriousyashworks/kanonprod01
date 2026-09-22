/* ============================================
   KicksAura Cart Sidebar
   ============================================ */
import { getCartItems, getCartTotal, getCartCount, removeFromCart, updateQuantity, updateCartBadge } from './cart.js';
import { formatCloudinaryUrl } from './ui.js';
import { shippingPolicyContent } from './policy-content.js';

const fmtPrice = (p) => '₹' + Number(p).toLocaleString('en-IN');

function hasDisplaySize(size) {
  const value = String(size ?? '').trim();
  return value && value.toLowerCase() !== 'one size' && value.toLowerCase() !== 'n/a';
}

// ─── Render ───────────────────────────────────────────────────────────────────
// ─── Render ───────────────────────────────────────────────────────────────────
export function renderCartSidebar() {
  const container = document.getElementById('cart-sidebar-items');
  const footer    = document.getElementById('cart-sidebar-footer');
  const countEl   = document.getElementById('cart-sidebar-count');
  const bannerEl  = document.getElementById('cart-shipping-banner');
  if (!container) return;

  const items = getCartItems();
  const count = getCartCount();
  const total = getCartTotal();

  if (countEl) countEl.textContent = count > 0 ? `(${count})` : '';

  // ─── Remove Free Shipping Banner ──────────────────────────────────────────
  if (bannerEl) {
    bannerEl.innerHTML = '';
    bannerEl.style.display = 'none';
  }

  // ─── Empty Cart State ───────────────────────────────────────────────────────
  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-sidebar-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p class="cart-empty-title">Your Cart is Empty</p>
        <a href="/products" class="cart-continue-btn" id="cart-continue-shopping">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Continue Shopping
        </a>
      </div>`;
    if (footer) footer.innerHTML = '';
    return;
  }

  // ─── Render Items ───────────────────────────────────────────────────────────
  container.innerHTML = items.map(item => {
    const imageUrl = item.productImage ? formatCloudinaryUrl(item.productImage) : '';
    const currentP = Number(item.price || 0);
    const origP = (item.basePrice && Number(item.basePrice) > currentP) ? Number(item.basePrice) : null;
    const unitPriceFmt = `Rs. ${currentP.toLocaleString('en-IN')}.00`;
    const origPriceFmt = origP ? `Rs. ${origP.toLocaleString('en-IN')}.00` : null;
    const totalPriceFmt = `Rs. ${(currentP * item.quantity).toLocaleString('en-IN')}.00`;

    const priceRowHTML = origPriceFmt
      ? `<span style="text-decoration: line-through; color: #888; font-size: 13px; margin-right: 6px;">${origPriceFmt}</span><span style="font-weight: 700; color: #111;">${unitPriceFmt}</span>`
      : `<span style="font-weight: 700; color: #111;">${unitPriceFmt}</span>`;

    const sizeMeta = hasDisplaySize(item.size)
      ? `<br/><span style="color: #666; font-size: 12.5px;">Size: ${item.size}</span>`
      : '';
    const videoCallLabel = item.liveVideoCall
      ? `<p class="modern-item-video-meta" style="margin-top: 4px; font-size: 11px; color: #16a34a; display: flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Video call before dispatch</p>`
      : '';

    return `
      <div class="cart-sidebar-item modern-cart-item" data-product-id="${item.productId}" data-variant-id="${item.variantId}">
        <div class="cart-sidebar-img modern-item-img">
          <a href="/product-details?id=${item.productId}" style="display: block; width: 100%; height: 100%; text-decoration: none;">
            ${imageUrl
              ? `<img src="${imageUrl}" alt="${item.productName}" />`
              : `<div class="cart-sidebar-img-placeholder" style="color: #111;">👟</div>`}
          </a>
        </div>
        <div class="cart-sidebar-details modern-item-details">
          <a href="/product-details?id=${item.productId}" style="text-decoration: none;">
            <p class="modern-item-name" style="margin-top: 0; font-weight: 600; font-size: 15px; color: #111;">${item.productName || 'Product'}</p>
          </a>
          <p class="modern-item-unit-meta" style="margin-bottom: 6px;">${priceRowHTML}${sizeMeta}</p>
          ${videoCallLabel}
          
          <div class="modern-item-controls">
            <div class="modern-qty-pill">
              ${item.quantity > 1 ? `<button class="modern-qty-btn cart-qty-minus" data-pid="${item.productId}" data-size="${item.size}" data-video="${item.liveVideoCall}" aria-label="Decrease">−</button>` : ''}
              <span class="modern-qty-num">${item.quantity}</span>
              <button class="modern-qty-btn cart-qty-plus" data-pid="${item.productId}" data-size="${item.size}" data-video="${item.liveVideoCall}" aria-label="Increase">+</button>
            </div>
            <button class="modern-trash-btn cart-remove-btn" data-pid="${item.productId}" data-size="${item.size}" data-video="${item.liveVideoCall}" aria-label="Remove item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>

          <div class="modern-item-total-price">${totalPriceFmt}</div>
        </div>
      </div>`;
  }).join('');

  // ─── Render Footer ────────────────────────────────────────────────────────
  if (footer) {
    const totalFmt = `Rs. ${Number(total).toLocaleString('en-IN')}.00`;
    let subtotalHtml = `<span style="font-size: 28px; font-weight: 600; color: #315bfb;">${totalFmt}</span>`;

    footer.innerHTML = `
      <div class="modern-cart-summary" style="border-top: none; padding-top: 10px; text-align: left;">
        <div class="modern-subtotal-row" style="display: block; margin-bottom: 12px;">
          <span class="modern-subtotal-label" style="font-size: 28px; font-weight: 600; color: #000;">Subtotal: </span>
          ${subtotalHtml}
        </div>
        <p class="modern-subtotal-subtext" style="color: #000; font-size: 16px;">Taxes, Discounts and <span class="shipping-policy-popup-link" style="color: #315bfb; cursor: pointer;">shipping</span> calculated at checkout</p>
        
        <button type="button" class="modern-checkout-btn" onclick="sessionStorage.setItem('checkout_intent', 'true'); window.location.href='/checkout'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Check Out</span>
        </button>

        <div class="modern-bottom-nav">
          <a href="/products" class="modern-continue-link" style="color: #315bfb; font-weight: 700; text-decoration: none;">← Continue Shopping</a>
          <a href="/cart" class="modern-view-cart-link" style="color: #315bfb; font-weight: 700; text-decoration: none;">View Cart →</a>
        </div>
      </div>`;

    footer.querySelector('.shipping-policy-popup-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      openShippingPolicyModal();
    });
  }

  // Bind quantity buttons
  container.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = items.find(i => i.productId === btn.dataset.pid && String(i.size) === String(btn.dataset.size) && String(i.liveVideoCall) === String(btn.dataset.video));
      if (!item) return;
      updateQuantity(item.productId, item.size, item.quantity + 1);
      updateCartBadge();
      renderCartSidebar();
    });
  });

  container.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = items.find(i => i.productId === btn.dataset.pid && String(i.size) === String(btn.dataset.size) && String(i.liveVideoCall) === String(btn.dataset.video));
      if (!item || item.quantity <= 1) return;
      updateQuantity(item.productId, item.size, item.quantity - 1);
      updateCartBadge();
      renderCartSidebar();
    });
  });

  // Bind remove buttons
  container.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = items.find(i => i.productId === btn.dataset.pid && String(i.size) === String(btn.dataset.size) && String(i.liveVideoCall) === String(btn.dataset.video));
      if (!item) return;
      removeFromCart(item.productId, item.size);
      updateCartBadge();
      renderCartSidebar();
    });
  });
}

// ─── Shipping Policy Modal Helper ─────────────────────────────────────────────
export function openShippingPolicyModal() {
  let overlay = document.getElementById('policy-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'policy-modal-overlay';
    overlay.id = 'policy-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="policy-modal" id="policy-modal">
        <div class="policy-modal-header">
          <h2 class="policy-modal-title">Shipping Policy</h2>
          <button type="button" class="policy-modal-close" onclick="document.getElementById('policy-modal-overlay').classList.remove('visible')">✕</button>
        </div>
        <div class="policy-modal-body">
          ${shippingPolicyContent}
        </div>
        <div class="policy-modal-footer">
          <button type="button" class="policy-modal-close-btn" onclick="document.getElementById('policy-modal-overlay').classList.remove('visible')">Close</button>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('visible');
    });
    document.body.appendChild(overlay);
  } else {
    const titleEl = overlay.querySelector('.policy-modal-title');
    const bodyEl = overlay.querySelector('.policy-modal-body');
    if (titleEl) titleEl.textContent = 'Shipping Policy';
    if (bodyEl) {
      bodyEl.innerHTML = shippingPolicyContent;
    }
  }
  overlay.classList.add('visible');
}

// ─── Init Sidebar ─────────────────────────────────────────────────────────────
export function initCartSidebar() {
  const sidebar  = document.getElementById('cart-sidebar');
  const overlay  = document.getElementById('cart-overlay');
  const trigger  = document.getElementById('cart-trigger');
  const closeBtn = document.getElementById('close-cart');

  if (!sidebar || !trigger) return;

  function openCartSidebar() {
    sidebar.classList.add('open');
    overlay?.classList.add('open');
    document.body.classList.add('sidebar-lock');
    renderCartSidebar();
  }

  function closeCartSidebar() {
    sidebar.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.classList.remove('sidebar-lock');
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openCartSidebar();
  });

  closeBtn?.addEventListener('click', closeCartSidebar);
  overlay?.addEventListener('click', closeCartSidebar);
  document.addEventListener('click', (e) => {
    if (e.target.closest('#close-cart')) {
      e.preventDefault();
      closeCartSidebar();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeCartSidebar();
    }
  });

  // Also re-render whenever cart updates
  window.addEventListener('cart-updated', () => {
    if (sidebar.classList.contains('open')) renderCartSidebar();
  });
}
