/* ============================================
   Orders Page Logic
   ============================================ */
import { getNavbarHTML, formatCloudinaryUrl, initSearch, initMobileMenu } from './ui.js';
import { updateCartBadge } from './cart.js';
import { getOrders, initProfileDropdown } from './profile.js';
import { getProductById } from './api.js';
import { initWishlistSidebar, updateWishlistBadge } from './wishlist.js';
import { initCartSidebar } from './cart-sidebar.js';
import { initLoginModalTrigger } from './login-modal.js';
import { getAuthUser } from './auth.js';

// Redirect if not logged in
if (!getAuthUser()) {
  window.location.href = '/?login=1';
}

// Render navbar
document.getElementById('navbar-container').innerHTML = getNavbarHTML();
initMobileMenu();
updateCartBadge();
initProfileDropdown();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initSearch();
initLoginModalTrigger();

const listView = document.getElementById('orders-list-view');
const detailView = document.getElementById('order-detail-view');

let currentOrders = [];

function hasDisplaySize(size) {
  const value = String(size ?? '').trim();
  return value && value.toLowerCase() !== 'one size' && value.toLowerCase() !== 'n/a';
}

const statusMap = {
  'ORDER_PLACED': 'Order Placed',
  'ORDER_CONFIRMED': 'Order Confirmed',
  'ORDER_DISPATCHED': 'Order Dispatched',
  'ORDER_DELIVERED': 'Order Delivered',
  'CANCELLED': 'Cancelled',
  'PENDING_REVIEW': 'Pending Review',
  'PENDING': 'Processing',
  'CONFIRMED': 'Confirmed',
  'SHIPPED': 'On its way',
  'DELIVERED': 'Delivered'
};

function formatDate(isoStr, includeYear = true) {
  if (!isoStr) return 'Unknown date';
  try {
    const d = new Date(isoStr);
    const options = { day: 'numeric', month: 'short' };
    if (includeYear) options.year = 'numeric';
    return d.toLocaleDateString('en-IN', options);
  } catch { return isoStr; }
}

async function fetchAndEnrichOrders() {
  const rawOrders = await getOrders();
  if (!rawOrders) return [];
  
  return await Promise.all(rawOrders.map(async (order) => {
    const items = await Promise.all((order.items || []).map(async (item) => {
      try {
        const product = await getProductById(item.productId);
        const variant = product?.variants?.find(v => v.id === item.variantId);
        return {
          ...item,
          productName: product?.name || item.productName || 'Product',
          productImage: product?.imageUrls?.[0] || item.productImage || item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2370',
          size: variant?.size || item.size || '',
          price: item.purchasePrice || item.price || 0
        };
      } catch (e) {
        return { ...item, productName: item.productName || 'Product', productImage: item.productImage || item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2370', size: item.size || '', price: item.purchasePrice || item.price || 0 };
      }
    }));
    return { ...order, items, total: order.totalAmount, placedAt: order.createdAt, orderId: order.orderNumber };
  }));
}

function renderOrdersList() {
  listView.style.display = 'block';
  detailView.style.display = 'none';

  if (!currentOrders || currentOrders.length === 0) {
    listView.innerHTML = `
      <div class="orders-empty">
        <div class="orders-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <h2>No orders yet</h2>
        <p>Looks like you haven't placed any orders yet.<br>Discover our latest collection of premium kicks.</p>
        <a href="/products" class="orders-empty-btn">Start Shopping</a>
      </div>`;
    return;
  }

  const ordersHtml = currentOrders.map((order, idx) => {
    const orderNum = order.orderId ? `${order.orderId}` : `Order ${currentOrders.length - idx}`;
    const total = (order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const orderStatus = statusMap[order.status] || statusMap[(order.status || '').toUpperCase()] || 'Order Placed';
    const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
    const placedDate = formatDate(order.placedAt);
    
    // Using first item's image for the card
    const firstItem = order.items?.[0];
    const imgSrc = firstItem?.productImage ? formatCloudinaryUrl(firstItem.productImage) : '';
    const imgHtml = imgSrc 
      ? `<img src="${imgSrc}" alt="${firstItem?.productName}" loading="lazy" />` 
      : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:24px;">👟</div>`;

    let displayTitle = firstItem?.productName || 'Sneakers';
    if (order.items && order.items.length > 1) {
      displayTitle += ` (+${order.items.length - 1})`;
    }

    return `
      <div class="new-order-card" data-index="${idx}">
        <div class="noc-image">${imgHtml}</div>
        <div class="noc-info">
          <h3 class="noc-status">${displayTitle}</h3>
          <p class="noc-meta">#${orderNum}</p>
          <div class="noc-extra-row">
            <span class="noc-chip noc-chip--status">${orderStatus}</span>
            <span class="noc-chip">${placedDate}</span>
            <span class="noc-chip">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        <div class="noc-actions">
          <p class="noc-total">₹${total}</p>
          <button class="noc-details-btn" type="button">View Details</button>
        </div>
      </div>
    `;
  }).join('');

  listView.innerHTML = `
    <div class="orders-page-head">
      <div>
        <a href="/" class="account-back-btn">
          <span aria-hidden="true">←</span>
          Back
        </a>
        <h1>My Orders</h1>
        <p>Track your purchases, payments, and delivery updates in one place.</p>
      </div>
      <span class="orders-count-pill">${currentOrders.length} ${currentOrders.length === 1 ? 'order' : 'orders'}</span>
    </div>
    <div class="orders-list-stack">
      ${ordersHtml}
    </div>
  `;

  // Attach click listeners to cards
  listView.querySelectorAll('.new-order-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = card.getAttribute('data-index');
      history.pushState({ view: 'orderDetail', idx }, '', '#detail');
      renderOrderDetail(currentOrders[idx], currentOrders.length - idx);
    });
  });
}

function renderOrderDetail(order, indexFallback) {
  listView.style.display = 'none';
  detailView.style.display = 'block';

  const orderNum = order.orderId ? `${order.orderId}` : `Order ${indexFallback}`;
  const total = (order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  
  let totalUnits = 0;
  (order.items || []).forEach(item => {
    totalUnits += (item.quantity || 1);
  });

  const isPrepaid = (order.paymentMethod || '').toUpperCase() === 'PREPAID';
  const shippingNum = (!isPrepaid && totalUnits > 0) ? (totalUnits * 99) : 0;
  
  // order.totalPrice should be the final total the user paid
  const finalTotal = order.totalPrice || order.total || 0;
  // Subtotal is what remains after subtracting shipping (assuming no discount info is saved)
  let subtotalNum = finalTotal - shippingNum;
  if (subtotalNum < 0) subtotalNum = 0;

  const subtotalStr = subtotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const shippingStr = shippingNum > 0 ? `₹${shippingNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Free';


  // Items HTML
  const itemsHTML = (order.items || []).map(item => {
    const imgSrc = item.productImage ? formatCloudinaryUrl(item.productImage) : '';
    const imgHtml = imgSrc ? `<img src="${imgSrc}" />` : '';
    const itemTotal = ((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    return `
      <div class="od-item">
        <div class="od-item-img">
          ${imgHtml}
          <div class="od-item-qty">${item.quantity || 1}</div>
        </div>
        <div class="od-item-info">
          <h4>${item.productName || 'Product'}</h4>
          ${hasDisplaySize(item.size) ? `<p>${item.size}</p>` : ''}
        </div>
        <div class="od-item-price">₹${itemTotal}</div>
      </div>
    `;
  }).join('');

  // Address
  const addr = order.shippingAddress || {};
  const addressStr = [
    addr.houseNumberOrAddress, 
    addr.landmark, 
    addr.city, 
    addr.state, 
    addr.pinCode, 
    'India'
  ].filter(Boolean).join('<br>');

  const profile = getAuthUser() || {};
  const emailStr = profile.email || 'guest@example.com';
  const phoneStr = profile.phoneNumber || addr.phone || '';
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Guest';

  let normalizedStatus = 'PLACED';
  const os = (order.status || '').toUpperCase();
  if (os.includes('CONFIRM')) normalizedStatus = 'CONFIRMED';
  if (os.includes('DISPATCH') || os.includes('SHIP')) normalizedStatus = 'DISPATCHED';
  if (os.includes('DELIVER')) normalizedStatus = 'DELIVERED';
  if (os.includes('CANCEL')) normalizedStatus = 'CANCELLED';
  if (os.includes('RETURN')) normalizedStatus = 'RETURNED';

  let summaryTitle = '';
  let summaryDesc = '';
  let summaryIcon = '';

  if (normalizedStatus === 'PLACED') {
    summaryTitle = 'Order Placed';
    summaryDesc = "We've received your order.";
    summaryIcon = '📝';
  } else if (normalizedStatus === 'CONFIRMED') {
    summaryTitle = 'Order Confirmed';
    summaryDesc = "Your order has been confirmed and is being prepared.";
    summaryIcon = '✅';
  } else if (normalizedStatus === 'DISPATCHED') {
    summaryTitle = 'Order Dispatched';
    summaryDesc = "Your order has been shipped.";
    summaryIcon = '🚚';
  } else if (normalizedStatus === 'DELIVERED') {
    summaryTitle = 'Order Delivered';
    summaryDesc = "Your order has been delivered successfully.";
    summaryIcon = '📦';
  } else if (normalizedStatus === 'CANCELLED') {
    summaryTitle = 'Order Cancelled';
    summaryDesc = "This order was cancelled.";
    summaryIcon = '❌';
  } else if (normalizedStatus === 'RETURNED') {
    summaryTitle = 'Order Returned';
    summaryDesc = "Your order has been returned.";
    summaryIcon = '↩️';
  }

  const dateStr = formatDate(order.placedAt, false);

  let steps = [];
  steps.push({ title: 'Order Placed', date: dateStr, status: normalizedStatus === 'PLACED' ? 'active' : 'completed', emoji: '🛒' });
  
  if (['CONFIRMED', 'DISPATCHED', 'DELIVERED', 'RETURNED'].includes(normalizedStatus)) {
    steps.push({ title: 'Order Confirmed', date: dateStr, status: normalizedStatus === 'CONFIRMED' ? 'active' : 'completed', desc: normalizedStatus === 'CONFIRMED' ? 'Your order has been confirmed and is being dispatched' : undefined, emoji: '✅' });
  }
  if (['DISPATCHED', 'DELIVERED', 'RETURNED'].includes(normalizedStatus)) {
    steps.push({ title: 'Order Dispatched', date: dateStr, status: normalizedStatus === 'DISPATCHED' ? 'active' : 'completed', emoji: '🚚' });
  }
  if (['DELIVERED'].includes(normalizedStatus)) {
    steps.push({ title: 'Order Delivered', date: dateStr, status: 'active', emoji: '📦' });
  }
  if (normalizedStatus === 'CANCELLED') {
    steps.push({ title: 'Order Cancelled', date: dateStr, status: 'active', emoji: '🚫' });
  }
  if (normalizedStatus === 'RETURNED') {
    steps.push({ title: 'Order Returned', date: dateStr, status: 'active', desc: 'Refund Completed', emoji: '↩️' });
  }

  const timelineStepsHtml = steps.reverse().map((step) => {
    let iconClass = 'mt-icon';
    if (step.status === 'completed') iconClass += ' completed';
    else if (step.status === 'active') iconClass += ' active';

    return `
      <div class="mt-step ${step.status}">
        <div class="${iconClass}">${step.emoji}</div>
        <div class="mt-content">
          <strong>${step.title}</strong>
          <span>${step.date}</span>
          ${step.desc ? `<div style="font-size:13px; color:#64748b; margin-top:2px;">${step.desc}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  let dispatchExtraHtml = '';
  if (normalizedStatus === 'DISPATCHED') {
    const trackingId = order.trackingId || 'Pending (will be assigned shortly)';
    const trackingLink = order.trackingLink || '#';
    const isPending = trackingId.toLowerCase().includes('pending') || trackingLink === '#';
    
    const trackBtn = isPending 
      ? `<button disabled style="width:100%; padding: 10px; background: #94a3b8; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: not-allowed; font-size: 14px;">Track Order</button>`
      : `<a href="${trackingLink}" target="_blank" style="display:block; text-align:center; width:100%; padding: 10px; background: #0f172a; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='#1e293b';" onmouseout="this.style.background='#0f172a';">Track Order</a>`;

    dispatchExtraHtml = `
      <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">
        <div style="margin-bottom:12px;">
          <strong style="color:#0f172a;">Tracking ID:</strong> ${trackingId}
        </div>
        ${trackBtn}
      </div>
    `;
  }

  const injectedStyles = `
  <style>
    .modern-timeline {
      position: relative;
      padding-left: 32px;
      margin-top: 24px;
      margin-bottom: 8px;
    }
    .mt-step {
      position: relative;
      margin-bottom: 24px;
    }
    .mt-step:not(:last-child)::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 26px;
      bottom: -24px;
      width: 2px;
      background: #e2e8f0;
      z-index: 1;
    }
    .mt-step:last-child {
      margin-bottom: 0;
    }
    .mt-icon {
      position: absolute;
      left: -32px;
      top: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      z-index: 2;
      font-size: 14px;
      border: 2px solid #e2e8f0;
    }
    .mt-icon.completed {
      border-color: #22c55e;
    }
    .mt-icon.active {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
    .mt-content strong {
      display: block;
      font-size: 15px;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .mt-content span {
      font-size: 13px;
      color: #64748b;
    }
    .mt-step.active .mt-content strong {
      color: #111;
    }
    .mt-step.completed .mt-content strong {
      color: #475569;
    }
    .order-summary-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    .osc-icon {
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: #f8fafc;
      border-radius: 50%;
      color: #0f172a;
    }
    .osc-info h3 {
      margin: 0 0 6px 0;
      font-size: 18px;
      color: #0f172a;
    }
    .osc-info p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
    }
  </style>
  `;

  const timelineBlock = `
    ${injectedStyles}
    
    <div class="od-card">
      <div class="modern-timeline">
        ${timelineStepsHtml}
      </div>
      ${dispatchExtraHtml}
    </div>
  `;

  detailView.innerHTML = `
    <div class="od-header">
      <div class="od-header-left">
        <button id="od-back-btn" class="od-back-btn" type="button">
          <span aria-hidden="true">←</span>
          Back
        </button>
        <div>
          <h2 class="od-title">Order #${orderNum}</h2>
          <p class="od-date">Confirmed ${formatDate(order.placedAt, false)}</p>
        </div>
      </div>
    </div>

    ${timelineBlock}

    <div class="od-card">
      ${itemsHTML}
      <div class="od-summary">
        <div class="od-summary-row"><span>Subtotal</span><span>₹${subtotalStr}</span></div>
        <div class="od-summary-row"><span>Shipping</span><span>${shippingStr}</span></div>
        <div class="od-summary-row total"><span>Total</span><span><small>INR</small> ₹${total}</span></div>
      </div>
    </div>

    <div class="od-card p-0">
      <table class="od-info-table">
        <tr>
          <td>Phone number</td>
          <td>${phoneStr || 'N/A'}</td>
        </tr>
        <tr>
          <td>Ship to</td>
          <td>${fullName}<br>${addressStr}<br>${phoneStr}</td>
        </tr>
        <tr>
          <td>Payment</td>
          <td>${isPrepaid ? 'Prepaid' : 'Cash on Delivery (COD)'}<br>₹${total} INR • ${formatDate(order.placedAt, false)}</td>
        </tr>
      </table>
    </div>

    <a href="https://wa.me/916239379751?text=Hi!%20I%20need%20help%20with%20an%20order%20I%20placed%0AOrder%20Id%20-%20${orderNum}" target="_blank" style="
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: #fff;
      border-radius: 30px;
      padding: 6px 16px 6px 6px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      text-decoration: none;
      z-index: 100;
      transition: transform 0.2s ease;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <div style="
        width: 36px;
        height: 36px;
        background: #25D366;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.575-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </div>
      <div style="display: flex; flex-direction: column; line-height: 1.2;">
        <span style="font-size: 11px; color: #64748b; font-weight: 500;">Need help with</span>
        <span style="font-size: 13px; color: #0f172a; font-weight: 700;">your order?</span>
      </div>
    </a>
  `;

  document.getElementById('od-back-btn').addEventListener('click', () => {
    window.location.href = '/';
  });
}

async function initOrdersPage() {
  history.replaceState({ view: 'orderList' }, '', window.location.pathname);
  currentOrders = await fetchAndEnrichOrders();
  renderOrdersList();
}

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.view === 'orderDetail') {
    const idx = e.state.idx;
    if (currentOrders && currentOrders[idx]) {
      renderOrderDetail(currentOrders[idx], currentOrders.length - idx);
    }
  } else {
    renderOrdersList();
  }
});

initOrdersPage();
