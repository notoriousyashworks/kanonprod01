/* ============================================================
   KicksAura Admin Panel — admin.js
   ============================================================ */
'use strict';

// ── Set View Store link from env var ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const storeLink = document.getElementById('view-store-link');
  if (storeLink && import.meta.env.VITE_STORE_URL) {
    storeLink.href = import.meta.env.VITE_STORE_URL;
  }
});

// ── Constants ──────────────────────────────────────────────
const ORDER_STATUSES = [
  'ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_DISPATCHED', 'ORDER_DELIVERED', 'CANCELLED', 'RETURNED',
];
const ADMIN_STATUSES = [
  'PENDING_REVIEW', 'PENDING', 'CONFIRMED', 'PACKED',
  'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'
];
const STATUS_LABELS = {
  ORDER_PLACED: 'Order Placed', ORDER_CONFIRMED: 'Order Confirmed',
  ORDER_DISPATCHED: 'Order Dispatched', ORDER_DELIVERED: 'Order Delivered',
  CANCELLED: 'Cancelled', RETURNED: 'Returned',
  // Legacy statuses for backward compatibility
  PENDING_REVIEW: 'Pending Review', PENDING: 'Pending',
  CONFIRMED: 'Confirmed', PACKED: 'Packed', SHIPPED: 'Shipped',
  DELIVERED: 'Delivered'
};
const STATUS_COLORS = {
  ORDER_PLACED: 'warning', ORDER_CONFIRMED: 'info',
  ORDER_DISPATCHED: 'purple', ORDER_DELIVERED: 'success',
  CANCELLED: 'danger', RETURNED: 'neutral',
  // Legacy colors
  PENDING_REVIEW: 'warning', PENDING: 'warning', CONFIRMED: 'info',
  PACKED: 'info', SHIPPED: 'purple', DELIVERED: 'success',
};
const PER_PAGE = 10;

// ── Cloudinary ─────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_ADMIN;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// ── State ──────────────────────────────────────────────────
const S = {
  section: 'dashboard',
  products: [], orders: [], stats: null,
  customers: [], categories: [], brands: [], coupons: [], reviews: [],
  pf: { search: '', category: '', page: 1 }, // product filter
  of: { search: '', status: '', page: 1 },   // order filter
  cf: { search: '', page: 1 },               // customer filter
  catPage: 1, brandPage: 1, couponPage: 1, reviewPage: 1,
};

// ── API Client ─────────────────────────────────────────────
const api = {
  async req(url, opts = {}) {
    const r = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    });
    if (r.status === 204) return null;
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem('kicksaura_auth_user');
      window.location.reload();
      throw new Error('Session expired. Please log in again.');
    }
    if (!r.ok) throw new Error(d.error || `Server error ${r.status}`);
    return d;
  },
  // Products
  getAdminProducts: () => api.req('/api/v1/admin/products?size=1000').then(d => d.content || d),
  createProduct: (d) => api.req('/api/v1/admin/products', { method: 'POST', body: JSON.stringify(d) }),
  updateProduct: (id, d) => api.req(`/api/v1/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProduct: (id) => api.req(`/api/v1/admin/products/${id}`, { method: 'DELETE' }),
  toggleVisibility: (id, v) => api.req(`/api/v1/admin/products/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ isVisible: v }) }),
  // Orders
  getAdminOrders: () => api.req('/api/v1/admin/orders?size=1000').then(d => d.content || d),
  getOrderStats: () => api.req('/api/v1/admin/orders/stats'),
  updateOrderStatus: (id, status, adminStatus) => api.req(`/api/v1/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminStatus }) }),
  updateOrderFull: (id, payload) => api.req(`/api/v1/admin/orders/${id}/full-update`, { method: 'PUT', body: JSON.stringify(payload) }),
  // Customers
  getAdminUsers: () => api.req('/api/v1/admin/users'),
  // Categories
  getCategories: () => api.req('/api/v1/admin/categories'),
  createCategory: (d) => api.req('/api/v1/admin/categories', { method: 'POST', body: JSON.stringify(d) }),
  updateCategory: (id, d) => api.req(`/api/v1/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteCategory: (id) => api.req(`/api/v1/admin/categories/${id}`, { method: 'DELETE' }),
  // Brands
  getBrands: () => api.req('/api/v1/admin/brands'),
  createBrand: (d) => api.req('/api/v1/admin/brands', { method: 'POST', body: JSON.stringify(d) }),
  updateBrand: (id, d) => api.req(`/api/v1/admin/brands/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteBrand: (id) => api.req(`/api/v1/admin/brands/${id}`, { method: 'DELETE' }),
  // Coupons
  getCoupons: () => api.req('/api/v1/admin/coupons'),
  createCoupon: (d) => api.req('/api/v1/admin/coupons', { method: 'POST', body: JSON.stringify(d) }),
  updateCoupon: (id, d) => api.req(`/api/v1/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteCoupon: (id) => api.req(`/api/v1/admin/coupons/${id}`, { method: 'DELETE' }),
  // Reviews
  getReviews: () => api.req('/api/v1/reviews'),
  createReview: (d) => api.req('/api/v1/reviews', { method: 'POST', body: JSON.stringify(d) }),
  deleteReview: (id) => api.req(`/api/v1/reviews/${id}`, { method: 'DELETE' }),
};

// ── Utilities ──────────────────────────────────────────────
const fmt = {
  currency(v) {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  },
  date(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  datetime(s) {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Cloudinary Upload Helpers ──────────────────────────────
async function uploadToCloudinary(file, resourceType = 'image', folder = null) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  fd.append('resource_type', resourceType);
  if (folder) {
    fd.append('folder', folder);
  }
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  if (resourceType === 'image' || data.resource_type === 'image') {
    const transformed = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${data.public_id}`;
    return transformed;
  }
  return data.secure_url;
}

// _uploaderState stores per-uploader URL arrays and active upload status
const _uploaderState = { images: [], videos: [], activeUploads: 0 };

function initMediaUploader(containerId, key, resourceType, accept, folder = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function render() {
    const urls = _uploaderState[key] || [];
    const thumbsHTML = urls.map((url, i) => {
      const isVideo = resourceType === 'video';
      let thumbUrl = url;
      if (!isVideo && typeof url === 'string' && url.includes('/upload/') && !url.includes('/f_auto')) {
        thumbUrl = url.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_600/');
      }

      const thumb = isVideo
        ? `<video src="${thumbUrl}" class="upload-thumb-video" muted playsinline></video>`
        : `<img src="${thumbUrl}" class="upload-thumb-img" alt="Uploaded photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:#1e1e1e; color:#bbb; font-size:11px; padding:8px; text-align:center; word-break:break-all;">${esc(url.split('/').pop() || 'photo')}</div>`;

      let coverBadge = '';
      let makeCoverBtn = '';
      if (resourceType === 'image') {
        if (i === 0) {
          coverBadge = `<span class="upload-cover-badge" style="position:absolute; bottom:6px; left:6px; right:6px; background:#e50914; color:#fff; font-size:11px; font-weight:700; padding:4px 0; text-align:center; border-radius:6px; z-index:2; box-shadow:0 2px 4px rgba(0,0,0,0.5);">★ Card Cover</span>`;
        } else {
          makeCoverBtn = `<button type="button" class="upload-make-cover" data-idx="${i}" style="position:absolute; bottom:6px; left:6px; right:6px; background:rgba(0,0,0,0.85); color:#fff; font-size:11px; font-weight:600; padding:4px 0; text-align:center; border-radius:6px; border:1px solid rgba(255,255,255,0.25); cursor:pointer; z-index:2; transition:all 0.2s;" title="Set as primary product card cover">★ Make Cover</button>`;
        }
      }

      return `<div class="upload-thumb" data-idx="${i}" style="position:relative;">
        ${thumb}
        ${coverBadge}
        ${makeCoverBtn}
        <button type="button" class="upload-thumb-remove" data-idx="${i}" title="Remove">×</button>
      </div>`;
    }).join('');

    const isUploading = _uploaderState['isUploading_' + key] || false;
    const dropzoneHint = isUploading 
      ? `<span class="upload-hint" style="color:#f39c12; font-weight:600;">⏳ Uploading ${resourceType}(s)... Please wait...</span>`
      : `<span class="upload-hint">Drop files here or <u>browse</u></span>`;

    container.innerHTML = `
      <div class="upload-thumbs" id="${containerId}-thumbs">${thumbsHTML}</div>
      <label class="upload-dropzone ${isUploading ? 'uploading' : ''}" id="${containerId}-zone" style="${isUploading ? 'opacity:0.7; pointer-events:none;' : ''}">
        <input type="file" accept="${accept}" multiple class="upload-file-input" id="${containerId}-input" ${isUploading ? 'disabled' : ''}>
        <div class="upload-dropzone-inner">
          <span class="upload-icon">${isUploading ? '⏳' : '☁'}</span>
          ${dropzoneHint}
          <span class="upload-sub">Uploads directly to Cloudinary (auto-converts HEIC/high-res)</span>
        </div>
      </label>
      <div class="upload-progress-bar" id="${containerId}-bar" style="${isUploading ? 'display:block;' : 'display:none;'}">
        <div class="upload-progress-fill" id="${containerId}-fill"></div>
      </div>`;

    // remove buttons
    container.querySelectorAll('.upload-thumb-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        _uploaderState[key].splice(parseInt(btn.dataset.idx), 1);
        render();
      });
    });

    // make cover buttons
    container.querySelectorAll('.upload-make-cover').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const [selected] = _uploaderState[key].splice(idx, 1);
        _uploaderState[key].unshift(selected);
        render();
        toast('Set as primary product card cover', 'success');
      });
    });

    // file input + drag
    const input = document.getElementById(`${containerId}-input`);
    const zone = document.getElementById(`${containerId}-zone`);

    if (input) input.addEventListener('change', e => handleFiles(Array.from(e.target.files)));

    if (zone) {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('dragover');
        handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith(resourceType + '/')));
      });
    }
  }

  async function handleFiles(files) {
    if (!files.length) return;
    _uploaderState['isUploading_' + key] = true;
    _uploaderState.activeUploads = (_uploaderState.activeUploads || 0) + 1;
    render();

    const bar = document.getElementById(`${containerId}-bar`);
    const fill = document.getElementById(`${containerId}-fill`);
    const submitBtn = document.getElementById('m-submit');
    const origText = submitBtn ? (submitBtn.dataset.originalLabel || submitBtn.textContent) : 'Save';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Uploading Image…';
    }
    if (bar) bar.style.display = 'block';
    let done = 0;
    for (const file of files) {
      try {
        if (fill) fill.style.width = Math.round((done / files.length) * 100) + '%';
        const url = await uploadToCloudinary(file, resourceType, folder);
        _uploaderState[key].push(url);
        done++;
        if (fill) fill.style.width = Math.round((done / files.length) * 100) + '%';
      } catch (e) {
        toast(`Failed to upload ${file.name}: ${e.message}`, 'error');
      }
    }
    _uploaderState['isUploading_' + key] = false;
    _uploaderState.activeUploads = Math.max(0, (_uploaderState.activeUploads || 1) - 1);
    if (submitBtn && _uploaderState.activeUploads === 0) {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
    render();
  }

  render();
}

function badge(status) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || 'neutral';
  return `<span class="badge badge-${color}">${label}</span>`;
}

function paginate(arr, page, per) {
  return arr.slice((page - 1) * per, page * per);
}

function pagination(total, page, per, onChange) {
  const pages = Math.ceil(total / per);
  if (pages <= 1) return '';
  let btns = '';
  for (let i = 1; i <= pages; i++) {
    btns += `<button class="page-btn ${i === page ? 'active' : ''}" data-p="${i}">${i}</button>`;
  }
  const id = `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // We'll use event delegation via data attributes
  return `
    <div class="pagination" data-pagination-id="${id}" data-current="${page}" data-total="${pages}">
      <button class="page-btn" data-p="${Math.max(1, page - 1)}" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>
      ${btns}
      <button class="page-btn" data-p="${Math.min(pages, page + 1)}" ${page === pages ? 'disabled' : ''}>Next ›</button>
    </div>`;
}

// Global pagination click — uses data attributes
function bindPagination(containerEl, onChange) {
  containerEl.querySelectorAll('[data-pagination-id] .page-btn[data-p]:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => onChange(parseInt(btn.dataset.p)));
  });
}

function showLoading(msg = 'Loading...') {
  document.getElementById('content-body').innerHTML = `
    <div class="loading-state"><div class="spinner"></div><p>${msg}</p></div>`;
}

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const tc = document.getElementById('toast-container');
  const id = 'tk-' + Date.now();
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  tc.insertAdjacentHTML('beforeend',
    `<div class="toast toast-${type}" id="${id}">
       <span class="toast-icon">${icon}</span>
       <span class="toast-message">${esc(msg)}</span>
     </div>`);
  const el = document.getElementById(id);
  requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('toast-visible')); });
  setTimeout(() => {
    el.classList.remove('toast-visible');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ── Confirm ────────────────────────────────────────────────
let _confirmCb = null;
function showConfirm(msg, title, onConfirm, label = 'Delete') {
  _confirmCb = onConfirm;
  document.getElementById('confirm-title').textContent = title || 'Are you sure?';
  document.getElementById('confirm-message').textContent = msg;
  document.getElementById('confirm-ok').textContent = label;
  document.getElementById('confirm-overlay').classList.remove('hidden');
}

// ── Modal ──────────────────────────────────────────────────
let _modalCb = null;
function showModal(title, bodyHTML, submitLabel, onSubmit) {
  _modalCb = onSubmit || null;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const footer = document.getElementById('modal-footer');
  if (onSubmit) {
    footer.innerHTML = `
      <button class="btn btn-secondary" id="m-cancel">Cancel</button>
      <button class="btn btn-primary" id="m-submit" data-original-label="${submitLabel || 'Save'}">${submitLabel || 'Save'}</button>`;
    document.getElementById('m-cancel').addEventListener('click', hideModal);
    document.getElementById('m-submit').addEventListener('click', async () => {
      const btn = document.getElementById('m-submit');
      if (!btn || btn.disabled) return;
      btn.disabled = true; btn.textContent = 'Saving...';
      try { await _modalCb(); }
      catch (e) { toast(e.message, 'error'); btn.disabled = false; btn.textContent = btn.dataset.originalLabel || submitLabel || 'Save'; }
    });
  } else {
    footer.innerHTML = `<button class="btn btn-secondary" id="m-close">Close</button>`;
    document.getElementById('m-close').addEventListener('click', hideModal);
  }
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-footer').innerHTML = '';
  _modalCb = null;
}

// ── Navigation ─────────────────────────────────────────────
const SECTION_META = {
  dashboard: { title: 'Dashboard', sub: 'Overview of your store' },
  products: { title: 'Products', sub: 'Manage your product catalog' },
  orders: { title: 'Orders', sub: 'Manage customer orders' },
  customers: { title: 'Customers', sub: 'View and manage customers' },
  categories: { title: 'Categories', sub: 'Manage product categories' },
  brands: { title: 'Brands', sub: 'Manage brands available for products' },
  coupons: { title: 'Coupons', sub: 'Manage discount coupons' },
  reviews: { title: 'Reviews', sub: 'Manage customer review images' },
};

function navigate(section) {
  S.section = section;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.section === section));
  const meta = SECTION_META[section] || {};
  document.getElementById('page-title').textContent = meta.title || section;
  document.getElementById('page-subtitle').textContent = meta.sub || '';
  document.getElementById('page-actions').innerHTML = '';
  ({
    dashboard: renderDashboard, products: renderProducts, orders: renderOrders,
    customers: renderCustomers, categories: renderCategories, brands: renderBrands,
    coupons: renderCoupons, reviews: renderReviews
  })[section]?.();
}

// ─────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────
async function renderDashboard() {
  document.getElementById('content-body').innerHTML = `
      <div class="stats-grid" id="dash-stats">
        ${statCard('stat-icon--revenue', `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`, 'Total Revenue', '...')}
        ${statCard('stat-icon--orders', `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`, 'Total Orders', '...')}
        ${statCard('stat-icon--pending', `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`, 'Pending Orders', '...')}
        ${statCard('stat-icon--customers', `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`, 'Total Customers', '...')}
        ${statCard('stat-icon--products', `<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>`, 'Total Products', '...')}
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Orders</h3>
          <button class="btn btn-ghost btn-sm" onclick="navigate('orders')">View All →</button>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Order #</th><th>City</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody id="dash-recent-orders">
              <tr><td colspan="6" class="empty-row">Loading recent orders...</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;

  try {
    const [stats, products, orders] = await Promise.all([
      api.getOrderStats(),
      S.products.length ? Promise.resolve(S.products) : api.getAdminProducts(),
      S.orders.length ? Promise.resolve(S.orders) : api.getAdminOrders(),
    ]);
    S.stats = stats; S.products = products || []; S.orders = orders || [];

    const statsGrid = document.getElementById('dash-stats');
    if (statsGrid) {
      statsGrid.innerHTML = `
        ${statCard('stat-icon--revenue', `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`, 'Total Revenue', fmt.currency(stats?.totalRevenue || 0))}
        ${statCard('stat-icon--orders', `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`, 'Total Orders', stats?.totalOrders || 0)}
        ${statCard('stat-icon--pending', `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`, 'Pending Orders', stats?.pendingOrders || 0)}
        ${statCard('stat-icon--customers', `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`, 'Total Customers', stats?.totalCustomers || 0)}
        ${statCard('stat-icon--products', `<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>`, 'Total Products', S.products.length)}
      `;
    }

    const recent = [...S.orders].slice(0, 8);
    const recentTable = document.getElementById('dash-recent-orders');
    if (recentTable) {
      recentTable.innerHTML = recent.length === 0
        ? `<tr><td colspan="6" class="empty-row">No orders yet</td></tr>`
        : recent.map(o => `<tr>
            <td><strong class="order-number">${esc(o.orderNumber)}</strong></td>
            <td class="text-muted">${esc(o.shippingAddress?.city || '—')}</td>
            <td>${o.items?.length || 0}</td>
            <td><strong>${fmt.currency(o.totalAmount)}</strong></td>
            <td>${badge(o.status)}</td>
            <td class="text-muted text-sm">${fmt.datetime(o.createdAt)}</td>
          </tr>`).join('');
    }
  } catch (e) {
    toast('Failed to load dashboard data: ' + e.message, 'error');
  }
}

function statCard(iconClass, iconPath, label, value) {
  return `<div class="stat-card">
    <div class="stat-icon ${iconClass}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg>
    </div>
    <div class="stat-info">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────
async function renderProducts() {
  showLoading();
  try {
    // Fetch products, categories and brands in parallel
    const [prods, cats, brands] = await Promise.all([
      api.getAdminProducts(),
      S.categories.length ? Promise.resolve(S.categories) : api.getCategories(),
      S.brands.length ? Promise.resolve(S.brands) : api.getBrands(),
    ]);
    S.products = prods || [];
    if (cats) S.categories = cats;
    if (brands) S.brands = brands;
    S.pf = { search: '', category: '', page: 1 };
    _renderProductsUI();
  } catch (e) { toast('Failed to load products: ' + e.message, 'error'); }
}

function _renderProductsUI() {
  const { search, category, page } = S.pf;
  // Use DB categories for the filter dropdown (sorted by name)
  const cats = S.categories.map(c => c.name).sort();

  let filtered = S.products;
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)); }
  if (category) { filtered = filtered.filter(p => p.category === category); }

  const total = filtered.length;
  const paged = paginate(filtered, page, PER_PAGE);

  document.getElementById('page-actions').innerHTML = `<button class="btn btn-primary" id="btn-add-product">+ Add Product</button>`;

  document.getElementById('content-body').innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" class="search-input" id="prod-search" placeholder="Search products…" value="${esc(search)}">
        </div>
        <select class="filter-select" id="cat-filter">
          <option value="">All Categories</option>
          ${cats.map(c => `<option value="${esc(c)}" ${c === category ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
      </div>
      <span class="result-count">${total} product${total !== 1 ? 's' : ''}</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr>
            <th>Product</th><th>Category</th><th>Price</th>
            <th>Variants</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${paged.length === 0
      ? `<tr><td colspan="6" class="empty-row">No products found</td></tr>`
      : paged.map(p => `<tr>
                  <td>
                    <div class="product-cell">
                      ${p.imageUrls?.[0]
          ? `<img src="${esc(p.imageUrls[0])}" alt="" class="product-thumb">`
          : `<div class="product-thumb-placeholder">👟</div>`}
                      <div>
                        <div class="product-name">${esc(p.name)}</div>
                        <div class="product-brand text-muted">${esc(p.brand)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="category-tag">${esc(p.category || '—')}</span></td>
                  <td>
                    <div class="price-cell">
                      ${p.discountedPrice ? `<span class="price-discounted">${fmt.currency(p.discountedPrice)}</span>` : ''}
                      <span class="${p.discountedPrice ? 'price-strikethrough' : 'price-base'}">${fmt.currency(p.basePrice)}</span>
                    </div>
                  </td>
                  <td><span class="variant-count">${p.variants?.length || 0} var.</span></td>
                  <td>
                    <button class="toggle-visibility ${p.visible ? 'visible-on' : 'visible-off'}"
                            data-id="${p.id}" data-vis="${p.visible}">
                      ${p.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-icon btn-icon--edit" data-action="edit" data-id="${p.id}" title="Edit">
                        ${iconEdit()}</button>
                      <button class="btn-icon btn-icon--copy" data-action="dup" data-id="${p.id}" title="Duplicate">
                        ${iconCopy()}</button>
                      <button class="btn-icon btn-icon--delete" data-action="del" data-id="${p.id}" title="Delete">
                        ${iconTrash()}</button>
                    </div>
                  </td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${pagination(total, page, PER_PAGE)}
    </div>`;

  // Bind events
  document.getElementById('btn-add-product').addEventListener('click', () => showProductForm());
  document.getElementById('prod-search').addEventListener('input', e => { S.pf.search = e.target.value; S.pf.page = 1; _renderProductsUI(); });
  document.getElementById('cat-filter').addEventListener('change', e => { S.pf.category = e.target.value; S.pf.page = 1; _renderProductsUI(); });

  document.querySelectorAll('.toggle-visibility').forEach(btn => btn.addEventListener('click', async () => {
    const curVis = btn.dataset.vis === 'true';
    try {
      await api.toggleVisibility(btn.dataset.id, !curVis);
      const p = S.products.find(p => p.id === btn.dataset.id);
      if (p) p.visible = !curVis;
      toast(`Product ${!curVis ? 'visible' : 'hidden'}`);
      _renderProductsUI();
    } catch (e) { toast(e.message, 'error'); }
  }));

  document.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', () => {
    const p = S.products.find(p => p.id === btn.dataset.id);
    if (p) showProductForm(p);
  }));
  document.querySelectorAll('[data-action="dup"]').forEach(btn => btn.addEventListener('click', () => {
    const p = S.products.find(p => p.id === btn.dataset.id);
    if (p) showProductForm({ ...p, id: null, name: p.name + ' (Copy)' });
  }));
  document.querySelectorAll('[data-action="del"]').forEach(btn => btn.addEventListener('click', () => {
    const p = S.products.find(p => p.id === btn.dataset.id);
    showConfirm(`Delete "${p?.name}"? This cannot be undone.`, 'Delete Product', async () => {
      await api.deleteProduct(btn.dataset.id);
      S.products = S.products.filter(p => p.id !== btn.dataset.id);
      toast('Product deleted');
      _renderProductsUI();
    });
  }));

  bindPagination(document.getElementById('content-body'), p => { S.pf.page = p; _renderProductsUI(); });
}

// ── Product Form ────────────────────────────────────────────
let _variantIdx = 0;
async function showProductForm(product = null) {
  // Ensure categories and brands are loaded for the pickers
  if (!S.categories.length) {
    try { S.categories = await api.getCategories() || []; } catch (e) { /* ignore */ }
  }
  if (!S.brands.length) {
    try { S.brands = await api.getBrands() || []; } catch (e) { /* ignore */ }
  }
  const isEdit = !!(product?.id);

  // Build the variant section
  // For new products (shoe flow): pre-fill UK 7–10.5 as defaults
  // For edits: load existing variants
  const ALL_SHOE_SIZES = [
    'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5',
    'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5', 'UK 11', 'UK 11.5', 'UK 12'
  ];
  const DEFAULT_SIZES = ['UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5'];

  // For edit: map existing variants by size
  const existingBySizeMap = {};
  if (isEdit && product?.variants?.length) {
    product.variants.forEach(v => { existingBySizeMap[v.size] = v; });
  }

  function buildSizeGrid() {
    return ALL_SHOE_SIZES.map((size, i) => {
      const existing = existingBySizeMap[size];
      const isDefault = DEFAULT_SIZES.includes(size);
      const checked = isEdit ? !!existing : isDefault;
      const stock = isEdit ? (existing?.stockQuantity ?? 0) : (isDefault ? 10 : 0);
      const displaySize = size.replace('UK ', '');
      return `
        <div class="size-grid-item ${checked ? '' : 'size-grid-item--off'}" data-size="${esc(size)}">
          <label class="size-grid-check">
            <input type="checkbox" class="sg-check" data-size="${esc(size)}" ${checked ? 'checked' : ''}>
            <span class="sg-size-label">${esc(displaySize)}</span>
          </label>
          <input type="number" class="sg-stock form-input" data-size="${esc(size)}"
            placeholder="Stock" value="${stock}" min="0"
            ${checked ? '' : 'disabled'}>
        </div>`;
    }).join('');
  }

  const varRows = buildSizeGrid();

  const form = `<form id="prod-form" autocomplete="off">
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Product Name *</label>
        <input class="form-input" name="name" value="${esc(product?.name || '')}" required placeholder="e.g. Nike Air Max 90">
      </div>
      <div class="form-group">
        <label class="form-label">Search Name <small class="text-muted">(for indexing)</small></label>
        <input class="form-input" name="searchName" value="${esc(product?.searchName || '')}" placeholder="lowercase name">
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Brand *</label>
        <input type="hidden" name="brand" id="brand-hidden" value="${esc(product?.brand || '')}" required>
        <button type="button" class="cat-picker-btn" id="brand-picker-btn">
          <span id="brand-picker-label">${esc(product?.brand || 'Select a brand…')}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="cat-picker-popup hidden" id="brand-picker-popup">
          <input class="cat-picker-search" id="brand-picker-search" placeholder="Search brands…" autocomplete="off">
          <div class="cat-picker-grid" id="brand-picker-grid"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Search Brand <small class="text-muted">(for indexing)</small></label>
        <input class="form-input" name="searchBrand" value="${esc(product?.searchBrand || '')}" placeholder="lowercase brand">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Category *</label>
      <input type="hidden" name="category" id="cat-hidden" value="${esc(product?.category || '')}" required>
      <button type="button" class="cat-picker-btn" id="cat-picker-btn">
        <span id="cat-picker-label">${esc(product?.category || 'Select a category…')}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="cat-picker-popup hidden" id="cat-picker-popup">
        <input class="cat-picker-search" id="cat-picker-search" placeholder="Search categories…" autocomplete="off">
        <div class="cat-picker-grid" id="cat-picker-grid"></div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Hidden Search Keywords <small class="text-muted">(for searching synonyms, tags, etc.)</small></label>
      <input class="form-input" name="searchText" value="${esc(product?.searchText || '')}" placeholder="e.g. running, sports, casual, sneaker">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" name="description" rows="3">${esc(product?.description || '')}</textarea>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Original Price (₹) *</label>
        <input type="number" class="form-input" name="basePrice" value="${product?.basePrice || ''}" min="0" step="1" required>
      </div>
      <div class="form-group">
        <label class="form-label">Selling Price (₹) <small class="text-muted">optional</small></label>
        <input type="number" class="form-input" name="discountedPrice" value="${product?.discountedPrice || ''}" min="0" step="1" placeholder="Leave blank = no discount">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Images <small class="text-muted">(First image with <b>★ Card Cover</b> will be your primary Product Card image across the store. Click <b>Make Cover</b> on any thumbnail to select it)</small></label>
      <div id="img-uploader"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Videos <small class="text-muted">(optional — drag & drop or browse)</small></label>
      <div id="vid-uploader"></div>
    </div>
    <div class="form-group">
      <label class="form-checkbox-label">
        <input type="checkbox" name="isVisible" ${product?.visible !== false ? 'checked' : ''}> Active / Visible on store
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isSaleVisible" ${product?.saleVisible ? 'checked' : ''}> Sale Badge Visible
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isVideoVisible" ${product?.videoVisible ? 'checked' : ''}> Video Available Badge Visible
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isLimitedStock" ${product?.limitedStock ? 'checked' : ''}> Limited Stock Badge Visible
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isNewArrival" ${product?.newArrival ? 'checked' : ''}> New Arrival
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isTrending" ${product?.trending ? 'checked' : ''}> Trending
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="withOgBox" ${product?.withOgBox ? 'checked' : ''}> With OG Box
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isInStockFlag" ${product ? (product.inStockFlag ? 'checked' : '') : 'checked'}> In Stock
      </label>
    </div>

    <div class="form-section-divider"><span>Sizes & Stock</span></div>
    <p class="form-hint" style="margin: -4px 0 12px; color: #888; font-size: 12.5px;">
      Sizes are optional. Keep them selected for shoes, or uncheck every size for products that do not need size selection.
    </p>
    <div id="size-grid-wrap" class="size-grid-wrap">
      ${varRows}
    </div>
  </form>`;

  // Seed uploader state with existing URLs when editing
  _uploaderState.images = product?.imageUrls ? [...product.imageUrls] : [];
  _uploaderState.videos = product?.videoUrls ? [...product.videoUrls] : [];
  _uploaderState.isUploading_images = false;
  _uploaderState.isUploading_videos = false;
  _uploaderState.activeUploads = 0;

  showModal(isEdit ? 'Edit Product' : 'Add New Product', form, isEdit ? 'Update' : 'Create', async () => {
    if (_uploaderState.activeUploads > 0 || _uploaderState.isUploading_images || _uploaderState.isUploading_videos) {
      throw new Error('Please wait for the image upload to finish.');
    }
    const f = document.getElementById('prod-form');
    const data = collectProductData(f);
    validateProductData(f, data);
    if (isEdit) {
      const updated = await api.updateProduct(product.id, data);
      const idx = S.products.findIndex(p => p.id === product.id);
      if (idx !== -1) S.products[idx] = updated;
      toast('Product updated');
    } else {
      const created = await api.createProduct(data);
      S.products.unshift(created);
      toast('Product created');
    }
    hideModal();
    _renderProductsUI();
  });

  // Bind size grid checkbox toggling
  requestAnimationFrame(() => {
    initMediaUploader('img-uploader', 'images', 'image', 'image/*', 'kicks-aura/products');
    initMediaUploader('vid-uploader', 'videos', 'video', 'video/*', 'kicks-aura/products');
    initCategoryPicker();
    initBrandPicker();

    document.querySelectorAll('.sg-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const item = cb.closest('.size-grid-item');
        const stockInput = item.querySelector('.sg-stock');
        if (cb.checked) {
          item.classList.remove('size-grid-item--off');
          stockInput.disabled = false;
          if (!stockInput.value || stockInput.value === '0') stockInput.value = 10;
        } else {
          item.classList.add('size-grid-item--off');
          stockInput.disabled = true;
          stockInput.value = 0;
        }
      });
    });
  });
}

function variantRow(i, v = {}) {
  return `<div class="variant-row" data-vi="${i}">
    <input class="form-input" name="vs_${i}" placeholder="Size (UK8)" value="${esc(v.size || '')}" required>
    <input type="number" class="form-input" name="vq_${i}" placeholder="Stock" value="${v.stockQuantity ?? ''}" min="0" required>
    <input class="form-input" name="vk_${i}" placeholder="SKU (NIKE-AIR-UK8)" value="${esc(v.sku || '')}" required>
    <button type="button" class="btn-icon btn-icon--delete rm-var" title="Remove">${iconX()}</button>
  </div>`;
}

function bindRemoveVariant() {
  document.querySelectorAll('.rm-var').forEach(btn => {
    btn.onclick = () => {
      const rows = document.querySelectorAll('.variant-row');
      if (rows.length > 1) btn.closest('.variant-row').remove();
      else toast('At least one variant is required', 'error');
    };
  });
}

function initCategoryPicker() {
  const btn = document.getElementById('cat-picker-btn');
  const popup = document.getElementById('cat-picker-popup');
  const search = document.getElementById('cat-picker-search');
  const grid = document.getElementById('cat-picker-grid');
  const hidden = document.getElementById('cat-hidden');
  const label = document.getElementById('cat-picker-label');
  if (!btn) return;

  let selected = hidden.value || '';

  function renderGrid(filter = '') {
    const cats = S.categories.filter(c =>
      !filter || c.name.toLowerCase().includes(filter.toLowerCase())
    );
    if (!cats.length) {
      grid.innerHTML = `<p class="cat-picker-empty">No categories found</p>`;
      return;
    }
    grid.innerHTML = cats.map(c => `
      <button type="button" class="cat-chip ${c.name === selected ? 'active' : ''}" data-name="${esc(c.name)}">
        ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="">` : ''}
        <span>${esc(c.name)}</span>
      </button>`).join('');
    grid.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selected = chip.dataset.name;
        hidden.value = selected;
        label.textContent = selected;
        popup.classList.add('hidden');
        // clear required validation style
        btn.classList.remove('cat-picker-btn--error', 'input-error');
      });
    });
  }

  // open/close
  btn.addEventListener('click', e => {
    e.stopPropagation();
    popup.classList.toggle('hidden');
    if (!popup.classList.contains('hidden')) {
      renderGrid();
      search.value = '';
      search.focus();
    }
  });
  search.addEventListener('input', () => renderGrid(search.value));

  // close on outside click
  document.addEventListener('click', function onOutside(e) {
    if (!popup.contains(e.target) && e.target !== btn) {
      popup.classList.add('hidden');
      document.removeEventListener('click', onOutside);
    }
  });

  // initial render so existing selection is visible
  renderGrid();
}

function clearProductValidationErrors(f) {
  f.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function flagProductField(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add('input-error');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (typeof el.focus === 'function') el.focus({ preventScroll: true });
}

function validateProductData(f, data) {
  clearProductValidationErrors(f);

  if (!data.name) {
    flagProductField('[name="name"]');
    throw new Error('Please enter a product name.');
  }

  if (!data.brand) {
    flagProductField('#brand-picker-btn');
    throw new Error('Please select a brand.');
  }

  if (!data.category) {
    flagProductField('#cat-picker-btn');
    throw new Error('Please select a category.');
  }

  if (!data.basePrice || data.basePrice <= 0) {
    flagProductField('[name="basePrice"]');
    throw new Error('Please enter a valid original price.');
  }

  if (data.discountedPrice !== null && data.discountedPrice < 0) {
    flagProductField('[name="discountedPrice"]');
    throw new Error('Selling price cannot be negative.');
  }

  if (!data.imageUrls || data.imageUrls.length === 0) {
    flagProductField('#img-uploader');
    throw new Error('Please upload at least one product image.');
  }

}

function collectProductData(f) {
  const v = n => f.querySelector(`[name="${n}"]`)?.value?.trim() || '';
  const variants = [];
  const brandVal = v('brand').toUpperCase().replace(/[^A-Z0-9]/g, '');
  f.querySelectorAll('.size-grid-item:not(.size-grid-item--off)').forEach(item => {
    const size = item.dataset.size;
    const stock = parseInt(item.querySelector('.sg-stock')?.value || '0', 10);
    const sku = `${brandVal}-${size.replace(/[^A-Z0-9]/g, '')}`;
    if (size) variants.push({ size, stockQuantity: stock, sku });
  });
  const payload = {
    name: v('name'), searchName: v('searchName') || v('name').toLowerCase(),
    brand: v('brand'), searchBrand: v('searchBrand') || v('brand').toLowerCase(),
    searchText: v('searchText'),
    category: v('category'), description: v('description'),
    basePrice: parseFloat(v('basePrice')) || 0,
    discountedPrice: parseFloat(v('discountedPrice')) || null,
    imageUrls: [..._uploaderState.images], videoUrls: [..._uploaderState.videos],
    visible: f.querySelector('[name="isVisible"]')?.checked ?? true,
    saleVisible: f.querySelector('[name="isSaleVisible"]')?.checked ?? false,
    videoVisible: f.querySelector('[name="isVideoVisible"]')?.checked ?? false,
    limitedStock: f.querySelector('[name="isLimitedStock"]')?.checked ?? false,
    newArrival: f.querySelector('[name="isNewArrival"]')?.checked ?? false,
    trending: f.querySelector('[name="isTrending"]')?.checked ?? false,
    withOgBox: f.querySelector('[name="withOgBox"]')?.checked ?? false,
    inStockFlag: f.querySelector('[name="isInStockFlag"]')?.checked ?? true,
    variants,
  };
  return payload;
}

// ── Brand Picker (mirrors initCategoryPicker) ───────────────
function initBrandPicker() {
  const btn = document.getElementById('brand-picker-btn');
  const popup = document.getElementById('brand-picker-popup');
  const search = document.getElementById('brand-picker-search');
  const grid = document.getElementById('brand-picker-grid');
  const hidden = document.getElementById('brand-hidden');
  const label = document.getElementById('brand-picker-label');
  if (!btn) return;

  let selected = hidden.value || '';

  function renderGrid(filter = '') {
    const brands = S.brands.filter(b =>
      !filter || b.name.toLowerCase().includes(filter.toLowerCase())
    );
    if (!brands.length) {
      grid.innerHTML = `<p class="cat-picker-empty">No brands found. Add one in the Brands section first.</p>`;
      return;
    }
    grid.innerHTML = brands.map(b => `
      <button type="button" class="cat-chip ${b.name === selected ? 'active' : ''}" data-name="${esc(b.name)}">
        <span>${esc(b.name)}</span>
      </button>`).join('');
    grid.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selected = chip.dataset.name;
        hidden.value = selected;
        label.textContent = selected;
        popup.classList.add('hidden');
        btn.classList.remove('cat-picker-btn--error', 'input-error');
      });
    });
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    popup.classList.toggle('hidden');
    if (!popup.classList.contains('hidden')) {
      renderGrid();
      search.value = '';
      search.focus();
    }
  });
  search.addEventListener('input', () => renderGrid(search.value));
  document.addEventListener('click', function onOutside(e) {
    if (!popup.contains(e.target) && e.target !== btn) {
      popup.classList.add('hidden');
      document.removeEventListener('click', onOutside);
    }
  });
  renderGrid();
}

// ─────────────────────────────────────────────────────────
// BRANDS  (full-page split-panel — mirrors Categories)
// ─────────────────────────────────────────────────────────
async function renderBrands() {
  showLoading();
  try {
    const brands = await api.getBrands();
    S.brands = brands || [];
    _renderBrandsPage();
  } catch (e) { toast('Failed to load brands: ' + e.message, 'error'); }
}

function _renderBrandsPage(editingBrand = null) {
  document.getElementById('page-actions').innerHTML = '';
  const isEdit = !!editingBrand;

  // count products per brand
  const brandCountMap = {};
  S.products.forEach(p => {
    if (p.brand) {
      const key = p.brand.toLowerCase();
      brandCountMap[key] = (brandCountMap[key] || 0) + 1;
    }
  });

  const brandCards = S.brands.map(b => {
    const count = brandCountMap[b.name.toLowerCase()] || 0;
    return `
    <div class="cat-card" data-id="${b.id}">
      <div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;font-size:32px;background:#1a1a1a;">🏷️</div>
      <div class="cat-card-info">
        <span class="cat-card-name">${esc(b.name)}</span>
        <span class="badge ${b.active ? 'badge-success' : 'badge-neutral'} cat-card-badge">${b.active ? 'Active' : 'Inactive'}</span>
      </div>
      <div class="cat-product-count">
        <span class="cat-product-count-icon">📦</span>
        <span>${count} product${count !== 1 ? 's' : ''}</span>
      </div>
      <div class="cat-card-actions">
        <button class="btn btn-sm btn-secondary edit-brand-inline" data-id="${b.id}">Edit</button>
        <button class="btn btn-sm btn-danger del-brand-inline" data-id="${b.id}">Delete</button>
      </div>
    </div>`;
  }).join('') || `<p class="cat-empty-msg">No brands yet. Add your first one →</p>`;

  document.getElementById('content-body').innerHTML = `
    <div class="cat-page-layout">
      <!-- Form panel -->
      <div class="cat-form-panel">
        <div class="cat-form-header">
          <h3 class="cat-form-title">${isEdit ? '✏️ Edit Brand' : '➕ Add Brand'}</h3>
          ${isEdit ? `<button class="btn btn-sm btn-secondary" id="brand-cancel-edit">Cancel</button>` : ''}
        </div>
        <form id="brand-inline-form" novalidate>
          <div class="form-group">
            <label class="form-label">Brand Name <span class="form-required">*</span></label>
            <input class="form-input" id="brand-name-input" type="text"
              value="${esc(editingBrand?.name || '')}"
              placeholder="e.g. Nike, New Balance, Adidas…"
              autocomplete="off" required>
          </div>
          <div class="form-group">
            <label class="form-checkbox-label">
              <input type="checkbox" id="brand-active-check" ${editingBrand?.active !== false ? 'checked' : ''}> Active / Available for products
            </label>
          </div>
          <button type="submit" class="btn btn-primary cat-submit-btn" id="brand-submit-btn">
            ${isEdit ? 'Update Brand' : 'Create Brand'}
          </button>
        </form>
      </div>
      <!-- Brand cards grid -->
      <div class="cat-grid-panel">
        <h3 class="cat-grid-title">All Brands <span class="cat-count-badge">${S.brands.length}</span></h3>
        <div class="cat-cards-grid">
          ${brandCards}
        </div>
      </div>
    </div>`;

  // Cancel edit
  document.getElementById('brand-cancel-edit')?.addEventListener('click', () => _renderBrandsPage());

  // Submit form
  document.getElementById('brand-inline-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('brand-name-input').value.trim();
    if (!nameVal) { toast('Brand name is required', 'error'); return; }
    const active = document.getElementById('brand-active-check').checked;
    const btn = document.getElementById('brand-submit-btn');
    btn.disabled = true; btn.textContent = isEdit ? 'Updating…' : 'Creating…';
    try {
      if (isEdit) {
        const updated = await api.updateBrand(editingBrand.id, { name: nameVal, active: active });
        const idx = S.brands.findIndex(b => b.id === editingBrand.id);
        if (idx !== -1) S.brands[idx] = updated;
        toast('Brand updated');
      } else {
        const created = await api.createBrand({ name: nameVal, active: active });
        S.brands.push(created);
        toast('Brand created');
      }
      _renderBrandsPage();
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = isEdit ? 'Update Brand' : 'Create Brand';
    }
  });

  // Edit buttons
  document.querySelectorAll('.edit-brand-inline').forEach(btn => {
    btn.addEventListener('click', () => {
      const b = S.brands.find(b => b.id === btn.dataset.id);
      if (b) _renderBrandsPage(b);
    });
  });

  // Delete buttons
  document.querySelectorAll('.del-brand-inline').forEach(btn => {
    btn.addEventListener('click', () => {
      const b = S.brands.find(b => b.id === btn.dataset.id);
      showConfirm(`Delete brand "${b?.name}"? Products using this brand will keep the name string.`, 'Delete Brand', async () => {
        await api.deleteBrand(btn.dataset.id);
        S.brands = S.brands.filter(b => b.id !== btn.dataset.id);
        toast('Brand deleted');
        _renderBrandsPage();
      });
    });
  });
}



// ─────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────
async function renderOrders() {
  showLoading();
  try {
    S.orders = await api.getAdminOrders() || [];
    S.of = { search: '', status: '', page: 1 };
    _renderOrdersUI();
  } catch (e) { toast('Failed to load orders: ' + e.message, 'error'); }
}

function _renderOrdersUI() {
  const { search, status, page } = S.of;
  let filtered = S.orders;
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(o => o.orderNumber?.toLowerCase().includes(q)); }
  if (status) { filtered = filtered.filter(o => o.status === status); }
  const total = filtered.length;
  const paged = paginate(filtered, page, PER_PAGE);

  document.getElementById('content-body').innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="search-input" id="ord-search" placeholder="Search by order number…" value="${esc(search)}">
        </div>
        <select class="filter-select" id="ord-status">
          <option value="">All Statuses</option>
          ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${STATUS_LABELS[s] || s}</option>`).join('')}
        </select>
      </div>
      <span class="result-count">${total} order${total !== 1 ? 's' : ''}</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Product</th><th>Shipping To</th><th>Items</th><th>Shipping Fee</th><th>Amount</th><th>Status</th><th>Admin Status</th><th>Date</th><th>Video Call</th><th>Actions</th></tr></thead>
          <tbody>
            ${paged.length === 0
      ? `<tr><td colspan="12" class="empty-row">No orders found</td></tr>`
      : paged.map(o => {
          const c = S.customers.find(c => c.uuid === o.userId);
          const custName = c ? esc(c.firstName + ' ' + (c.lastName || '')).trim() : 'Guest';
          const pNames = (o.items || []).map(i => { const p = S.products.find(p => p.id === i.productId); return p ? esc(p.name) : 'Unknown'; });
          const prodStr = pNames.length > 0 ? pNames[0] + (pNames.length > 1 ? ` (+${pNames.length - 1})` : '') : '—';
          return `<tr>
                  <td><strong class="order-number">${esc(o.orderNumber)}</strong></td>
                  <td>${custName}</td>
                  <td><span title="${pNames.join(', ')}">${prodStr}</span></td>
                  <td class="text-muted text-sm">${esc(o.shippingAddress?.city || '—')}, ${esc(o.shippingAddress?.state || '')}</td>
                  <td>${o.items?.length || 0}</td>
                  <td class="text-muted">${fmt.currency(o.shippingFees || 0)}</td>
                  <td><strong>${fmt.currency(o.totalAmount)}</strong></td>
                  <td>${badge(o.status)}</td>
                  <td>${badge(o.adminStatus || 'PENDING_REVIEW')}</td>
                  <td class="text-muted text-sm">${fmt.datetime(o.createdAt)}</td>
                  <td>${o.liveVideoCall ? '<span style="color:#166534; font-weight:600;">Yes</span>' : '<span style="color:#64748b;">No</span>'}</td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-sm btn-secondary view-ord" data-id="${o.id}">View</button>
                      <button class="btn btn-sm btn-primary receipt-ord" data-id="${o.id}">Order Detail</button>
                    </div>
                  </td>
                </tr>`;
        }).join('')}
          </tbody>
        </table>
      </div>
      ${pagination(total, page, PER_PAGE)}
    </div>`;

  document.getElementById('ord-search').addEventListener('input', e => { S.of.search = e.target.value; S.of.page = 1; _renderOrdersUI(); });
  document.getElementById('ord-status').addEventListener('change', e => { S.of.status = e.target.value; S.of.page = 1; _renderOrdersUI(); });
  document.querySelectorAll('.view-ord').forEach(btn => btn.addEventListener('click', () => {
    const o = S.orders.find(o => o.id === btn.dataset.id); if (o) showOrderDetail(o);
  }));
  document.querySelectorAll('.receipt-ord').forEach(btn => btn.addEventListener('click', () => {
    const o = S.orders.find(o => o.id === btn.dataset.id); if (o) showReceiptModal(o);
  }));
  bindPagination(document.getElementById('content-body'), p => { S.of.page = p; _renderOrdersUI(); });
}

function showOrderDetail(order) {
  const addr = order.shippingAddress;
  const addrStr = addr ? [addr.houseNumberOrAddress, addr.landmark, addr.city, addr.state, addr.pinCode].filter(Boolean).join(', ') : '—';
  const customer = S.customers.find(c => c.uuid === order.userId);
  const videoCallRequested = Boolean(order.liveVideoCall);
  const itemRows = (order.items || []).map(item => {
    const prod = S.products.find(p => p.id === item.productId);
    const vari = prod?.variants?.find(v => v.id === item.variantId);
    
    // Status Dropdown for Item
    const itemStatuses = ['PENDING', 'ACCEPTED', 'EDITED', 'CANCELLED'];
    const statusSelect = `<select class="item-status-select" data-id="${item.id}" style="padding: 2px 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
      ${itemStatuses.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select>`;

    let sizeSelectHTML = `<td>Not required</td>`;
    if (prod && prod.variants && prod.variants.length > 0) {
      sizeSelectHTML = `<td>
        <select class="item-variant-select" data-id="${item.id}" style="padding: 2px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; width: 60px;">
          ${prod.variants.map(v => `<option value="${v.id}" ${v.id === item.variantId ? 'selected' : ''}>${esc(v.size)}</option>`).join('')}
        </select>
      </td>`;
    }

    return `<tr class="item-row-data" data-id="${item.id}">
      <td>${esc(prod?.name || 'Product')}</td>
      ${sizeSelectHTML}
      <td>
        <input type="number" min="1" max="${item.quantity}" class="item-qty-input" value="${item.quantity}" style="width: 50px; padding: 2px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
      </td>
      <td>${fmt.currency(item.purchasePrice)}</td>
      <td><strong class="item-subtotal-display" data-price="${item.purchasePrice}">${fmt.currency(item.purchasePrice * item.quantity)}</strong></td>
      <td>${statusSelect}</td>
    </tr>`;
  }).join('');

  const html = `<div class="order-detail">
    <div style="background:${videoCallRequested ? '#dcfce7' : '#f1f5f9'}; color:${videoCallRequested ? '#166534' : '#64748b'}; padding:12px 16px; border-radius:8px; margin-bottom:20px; border:1px solid ${videoCallRequested ? '#bbf7d0' : '#e2e8f0'}; font-weight:600; display:flex; align-items:center; gap:8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${videoCallRequested ? '<polyline points="20 6 9 17 4 12"></polyline>' : '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'}
      </svg>
      Live Video Call Before Dispatch: ${videoCallRequested ? 'Requested' : 'Not Requested'}
    </div>
    <div class="detail-grid">
      <div class="detail-section">
        <div class="detail-section-title">Customer</div>
        ${customer
      ? `<p><strong>${esc(customer.firstName)} ${esc(customer.lastName)}</strong></p>
             <p class="text-muted">${esc(customer.phoneNumber)}</p>
             ${customer.email ? `<p class="text-muted">${esc(customer.email)}</p>` : ''}`
      : `<p class="text-muted">ID: ${esc(order.userId)}</p>`}
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Order Info</div>
        <p><strong>${esc(order.orderNumber)}</strong></p>
        <p class="text-muted">${fmt.datetime(order.createdAt)}</p>
        <div class="form-group mt-8">
          <label style="font-size:11px; color:#666;">Global Status</label>
          <select class="form-select" id="order-global-status">
            ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${STATUS_LABELS[s] || s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Admin Status</label>
          <select class="form-select" id="order-admin-status">
            ${ADMIN_STATUSES.map(s => `<option value="${s}" ${s === (order.adminStatus || 'PENDING_REVIEW') ? 'selected' : ''}>${STATUS_LABELS[s] || s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Tracking ID</label>
          <input type="text" class="form-input" id="order-tracking-id" value="${esc(order.trackingId || '')}" placeholder="Tracking ID">
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Tracking Link</label>
          <input type="url" class="form-input" id="order-tracking-link" value="${esc(order.trackingLink || '')}" placeholder="URL">
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Shipping Fees</label>
          <input type="number" class="form-input" id="order-shipping-fees" value="${order.shippingFees !== null && order.shippingFees !== undefined ? order.shippingFees : ''}" placeholder="Fee">
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Phone Number</label>
          <input type="text" class="form-input" id="order-phone-number" value="${esc(order.phoneNumber || '')}" placeholder="Phone Number">
        </div>
      </div>
    </div>
    <div class="detail-section mt-16">
      <div class="detail-section-title">Shipping Address</div>
      <p>${esc(addrStr)}</p>
    </div>
    <div class="detail-section mt-16">
      <div class="detail-section-title">Items (${order.items?.length || 0})</div>
      <table class="table table-compact">
        <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th><th>Status</th></tr></thead>
        <tbody>${itemRows || '<tr><td colspan="6" class="empty-row">No items</td></tr>'}</tbody>
      </table>
    </div>
    <div class="detail-section mt-16">
      <div class="detail-section-title">Summary</div>
      <div class="order-summary">
        <div class="summary-row"><span>Total Amount</span><strong id="modal-total-amount">${fmt.currency(order.totalAmount)}</strong></div>
        <div class="summary-row">
          <span>Payment</span>
          <select class="form-select" id="order-payment-method" style="width: 140px; text-align:right;">
            <option value="COD" ${(order.paymentMethod || 'COD').toUpperCase() === 'COD' ? 'selected' : ''}>Cash on Delivery</option>
            <option value="PREPAID" ${(order.paymentMethod || '').toUpperCase() === 'PREPAID' ? 'selected' : ''}>Prepaid</option>
          </select>
        </div>
      </div>
    </div>
  </div>`;

  showModal(`Edit Order — ${order.orderNumber}`, html, 'Save Changes', async () => {
    const globalStatus = document.getElementById('order-global-status').value;
    const adminStatus = document.getElementById('order-admin-status').value;
    const paymentMethod = document.getElementById('order-payment-method').value;
    const itemRows = document.querySelectorAll('.item-row-data');
    
    const itemUpdates = Array.from(itemRows).map(row => {
      const vSelect = row.querySelector('.item-variant-select');
      return {
        id: row.dataset.id,
        status: row.querySelector('.item-status-select').value,
        quantity: parseInt(row.querySelector('.item-qty-input').value, 10),
        variantId: vSelect ? vSelect.value : undefined
      };
    });

    try {
      // 1. Update full details (Items & Payment)
      const trackingId = document.getElementById('order-tracking-id').value;
      const trackingLink = document.getElementById('order-tracking-link').value;
      const shippingFees = document.getElementById('order-shipping-fees').value;
      const phoneNumber = document.getElementById('order-phone-number').value;
      
      const updatedOrder = await api.updateOrderFull(order.id, {
        paymentMethod: paymentMethod,
        items: itemUpdates,
        trackingId: trackingId,
        trackingLink: trackingLink,
        shippingFees: shippingFees !== '' ? parseFloat(shippingFees) : null,
        phoneNumber: phoneNumber
      });
      // 2. Update global status if changed
      if (globalStatus !== order.status || adminStatus !== (order.adminStatus || 'PENDING_REVIEW')) {
         const res = await api.updateOrderStatus(order.id, globalStatus, adminStatus);
         updatedOrder.status = res.status;
         updatedOrder.adminStatus = res.adminStatus;
      }
      
      const idx = S.orders.findIndex(o => o.id === order.id);
      if (idx !== -1) S.orders[idx] = updatedOrder;
      
      toast('Order updated successfully');
      hideModal();
      _renderOrdersUI();
    } catch(e) {
      toast('Failed to update order: ' + e.message, 'error');
      throw e;
    }
  });

  // Dynamic recalculation logic for modal
  const qtyInputs = document.querySelectorAll('.item-qty-input');
  const totalDisplay = document.getElementById('modal-total-amount');
  const paymentSelect = document.getElementById('order-payment-method');
  const statusSelects = document.querySelectorAll('.item-status-select');

  function recalc() {
    let subtotal = 0;
    let totalUnits = 0;
    document.querySelectorAll('.item-row-data').forEach(row => {
      const qty = parseInt(row.querySelector('.item-qty-input').value, 10) || 1;
      const price = parseFloat(row.querySelector('.item-subtotal-display').dataset.price);
      
      const subDisplay = row.querySelector('.item-subtotal-display');
      subDisplay.textContent = fmt.currency(price * qty);

      subtotal += (price * qty);
      totalUnits += qty;
    });

    const isPrepaid = paymentSelect.value === 'PREPAID';
    let discount = isPrepaid ? (totalUnits * 200) : 0;
    let shipping = (!isPrepaid && totalUnits > 0) ? (totalUnits * 99) : 0;
    
    if (subtotal === 0) { discount = 0; shipping = 0; }
    
    const newTotal = subtotal - discount + shipping;
    if (totalDisplay) totalDisplay.textContent = fmt.currency(newTotal);
  }

  qtyInputs.forEach(i => i.addEventListener('input', recalc));
  paymentSelect.addEventListener('change', recalc);
  statusSelects.forEach(s => s.addEventListener('change', recalc));
}

// ─────────────────────────────────────────────────────────
// RECEIPT MODAL
// ─────────────────────────────────────────────────────────
function showReceiptModal(order) {
  const addr = order.shippingAddress;
  const fullName = [order.firstName, order.lastName].filter(Boolean).join(' ') || order.phoneNumber || 'Customer';
  const isPrepaid = (order.paymentMethod || '').toUpperCase() === 'PREPAID';
  const phone = order.phoneNumber || addr?.phone || '—';

  let itemsHTML = '';
  let subtotalNum = 0;
  let totalUnits = 0;
  (order.items || []).forEach((item, index) => {
    const prod = S.products.find(p => p.id === item.productId);
    const vari = prod?.variants?.find(v => v.id === item.variantId);
    const imgSrc = prod?.imageUrls?.[0] || item.productImage || item.imageUrl || '';

    const qty = item.quantity || 1;
    const unitPrice = item.purchasePrice || (prod?.discountedPrice ?? prod?.basePrice) || 0;
    subtotalNum += unitPrice * qty;
    totalUnits += qty;

    let formattedImg = imgSrc;
    if (imgSrc.includes('res.cloudinary.com') && !imgSrc.includes('/q_auto')) {
      const parts = imgSrc.split('/upload/');
      if (parts.length === 2) formattedImg = parts[0] + '/upload/w_200,h_200,c_fill,q_auto,f_auto/' + parts[1];
    }

    const imgEl = formattedImg
      ? `<img src="${formattedImg}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;flex-shrink:0;">`
      : '';

    const isLast = index === (order.items || []).length - 1;
    itemsHTML += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${isLast ? '' : 'border-bottom:1px solid #f1f5f9;'}">
        ${imgEl}
        <div style="flex:1;">
          <div style="font-size:13px;color:#1e293b;margin-bottom:4px;">${esc(prod?.name || item.productName || 'Product')}</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="background:${isPrepaid ? '#dcfce7' : '#ffedd5'};color:${isPrepaid ? '#166534' : '#9a3412'};padding:1px 7px;border-radius:3px;font-size:10px;font-weight:600;">${isPrepaid ? 'PREPAID' : 'COD'}</span>
            <span style="font-size:11px;color:#64748b;">Qty: <b style="color:#0f172a;">${qty}</b></span>
            ${vari?.size || item.size ? `<span style="font-size:11px;color:#64748b;">Size: <b style="color:#0f172a;">${esc(vari?.size || item.size)}</b></span>` : ''}
          </div>
        </div>
      </div>`;
  });

  const shippingNum   = isPrepaid ? 0 : totalUnits * 99;
  const discountNum   = isPrepaid ? totalUnits * 200 : 0;
  const computedTotal = subtotalNum - discountNum + shippingNum;
  const fmtINR = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const addrLine = [addr?.houseNumberOrAddress, addr?.landmark, addr?.city, addr?.state, addr?.pinCode].filter(Boolean).join(', ');

  const receiptId = `receipt-${order.id}`;

  const receiptHTML = `
    <div id="${receiptId}" style="font-family:'Inter',sans-serif;background:#fff;width:480px;padding:0;border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:#0f172a;color:#fff;padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
          <div style="background:#000;display:inline-flex;padding:6px 12px;border-radius:5px;font-family:'Inter',sans-serif;font-weight:900;font-size:22px;letter-spacing:0.5px;box-shadow: 0 1px 3px rgba(0,0,0,0.5);">
            <span style="color:#fff;">KICKS</span><span style="color:#ff0000;margin-left:3px;">AURA</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:9px;opacity:0.55;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Order ID</div>
            <div style="font-size:13px;font-weight:600;letter-spacing:0.3px;">${esc(order.orderNumber)}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:9px;opacity:0.55;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Date</div>
            <div style="font-size:13px;">${fmt.date(order.createdAt)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;opacity:0.55;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Total</div>
            <div style="font-size:16px;font-weight:700;">${fmtINR(computedTotal)}</div>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div style="padding:12px 20px 4px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Items</div>
        ${itemsHTML}
      </div>

      <!-- Price breakdown -->
      <div style="padding:10px 20px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Pricing</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>Subtotal</span><span>${fmtINR(subtotalNum)}</span>
        </div>
        ${isPrepaid ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>Prepaid discount</span><span>− ${fmtINR(discountNum)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>Shipping</span><span>Free</span>
        </div>` : `
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>COD shipping (Advance)</span><span>+ ${fmtINR(shippingNum)}</span>
        </div>`}
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:7px;margin-top:2px;">
          <span>Total</span><span>${fmtINR(computedTotal)}</span>
        </div>
      </div>

      <!-- Customer -->
      <div style="padding:10px 20px;background:#f8fafc;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:11px;margin-bottom:8px;">
          <div>
            <div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Customer</div>
            <div style="color:#0f172a;">${esc(fullName)}</div>
          </div>
          <div>
            <div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Payment</div>
            <div style="color:#0f172a;">${isPrepaid ? 'Prepaid' : 'COD'}</div>
          </div>
        </div>
        <div style="font-size:11px;margin-top:8px;">
          <div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Delivery Address</div>
          <div style="color:#0f172a;line-height:1.5;">${esc(addrLine || '—')}<br>${esc(phone)}</div>
        </div>
      </div>

      <!-- Support Note -->
      <div style="padding:12px 20px 16px; text-align:left; font-size:10px; color:#94a3b8; background:#fff;">
        If any issues, share order and query on email - <span style="color:#0f172a;">kicksauraa@gmail.com</span>
      </div>

    </div>`;

  const html = `
    <div>
      ${receiptHTML}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
        <div>
        </div>
        <button id="pdf-download-btn"
          style="background:#0f172a;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-family:inherit;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PDF
        </button>
      </div>
    </div>`;

  showModal('Order Detail', html);

  requestAnimationFrame(() => {
    const btn = document.getElementById('pdf-download-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Generating…';
      const el = document.getElementById(receiptId);
      await html2pdf()
        .set({
          margin: 8,
          filename: `${order.orderNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
        })
        .from(el)
        .save();
      btn.disabled = false;
      btn.innerHTML = '✓ Downloaded';
      setTimeout(() => { btn.innerHTML = '↓ Download PDF'; btn.disabled = false; }, 2500);
    });
  });
}

// ─────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────
async function renderCustomers() {
  showLoading();
  try {
    [S.customers, S.orders] = await Promise.all([
      api.getAdminUsers().then(d => d || []),
      S.orders.length ? Promise.resolve(S.orders) : api.getAdminOrders().then(d => d || []),
    ]);
    S.cf = { search: '', page: 1 };
    _renderCustomersUI();
  } catch (e) { toast('Failed to load customers: ' + e.message, 'error'); }
}

function _renderCustomersUI() {
  const { search, page } = S.cf;
  let filtered = S.customers;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.phoneNumber?.includes(q) ||
      c.email?.toLowerCase().includes(q));
  }
  const total = filtered.length;
  const paged = paginate(filtered, page, PER_PAGE);

  document.getElementById('content-body').innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="search-input" id="cust-search" placeholder="Search customers…" value="${esc(search)}">
        </div>
      </div>
      <span class="result-count">${total} customer${total !== 1 ? 's' : ''}</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            ${paged.length === 0
      ? `<tr><td colspan="8" class="empty-row">No customers found</td></tr>`
      : paged.map(c => {
        const ords = S.orders.filter(o => o.userId === c.uuid);
        const spent = ords.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const initials = (c.firstName?.[0] || '?').toUpperCase();
        return `<tr>
                    <td>
                      <div class="customer-name">
                        <div class="avatar">${initials}</div>
                        <span>${esc(c.firstName)} ${esc(c.lastName)}</span>
                      </div>
                    </td>
                    <td>${esc(c.phoneNumber)}</td>
                    <td class="text-muted">${esc(c.email || '—')}</td>
                    <td><span class="role-tag role-${(c.role || '').toLowerCase().replace('role_', '')}">${esc((c.role || '').replace('ROLE_', ''))}</span></td>
                    <td>${ords.length}</td>
                    <td>${fmt.currency(spent)}</td>
                    <td class="text-muted text-sm">${fmt.date(c.createdAt)}</td>
                    <td><button class="btn btn-sm btn-secondary view-cust" data-uuid="${c.uuid}">View</button></td>
                  </tr>`;
      }).join('')}
          </tbody>
        </table>
      </div>
      ${pagination(total, page, PER_PAGE)}
    </div>`;

  document.getElementById('cust-search').addEventListener('input', e => { S.cf.search = e.target.value; S.cf.page = 1; _renderCustomersUI(); });
  document.querySelectorAll('.view-cust').forEach(btn => btn.addEventListener('click', () => {
    const c = S.customers.find(c => c.uuid === btn.dataset.uuid); if (c) showCustomerDetail(c);
  }));
  bindPagination(document.getElementById('content-body'), p => { S.cf.page = p; _renderCustomersUI(); });
}

function showCustomerDetail(c) {
  const ords = S.orders.filter(o => o.userId === c.uuid);
  const spent = ords.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const addr = c.userAddress;
  const html = `<div class="order-detail">
    <div class="detail-grid">
      <div class="detail-section">
        <div class="detail-section-title">Profile</div>
        <div class="customer-detail-header">
          <div class="avatar avatar-lg">${(c.firstName?.[0] || '?').toUpperCase()}</div>
          <div>
            <p><strong>${esc(c.firstName)} ${esc(c.lastName)}</strong></p>
            <p class="text-muted">${esc(c.phoneNumber)}</p>
            ${c.email ? `<p class="text-muted">${esc(c.email)}</p>` : ''}
          </div>
        </div>
        <p class="mt-8"><span class="role-tag role-${(c.role || '').toLowerCase().replace('role_', '')}">${esc((c.role || '').replace('ROLE_', ''))}</span></p>
        <p class="text-muted mt-4">Joined: ${fmt.date(c.createdAt)}</p>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Stats</div>
        <div class="mini-stat"><span>Total Orders</span><strong>${ords.length}</strong></div>
        <div class="mini-stat mt-8"><span>Lifetime Spend</span><strong>${fmt.currency(spent)}</strong></div>
      </div>
    </div>
    ${addr ? `<div class="detail-section mt-16">
      <div class="detail-section-title">Saved Address</div>
      <p>${esc([addr.houseNumberOrAddress, addr.landmark, addr.city, addr.state, addr.pinCode].filter(Boolean).join(', '))}</p>
    </div>` : ''}
    <div class="detail-section mt-16">
      <div class="detail-section-title">Order History</div>
      <table class="table table-compact">
        <thead><tr><th>Order #</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${ords.length === 0
      ? '<tr><td colspan="4" class="empty-row">No orders</td></tr>'
      : ords.map(o => `<tr>
              <td class="order-number">${esc(o.orderNumber)}</td>
              <td>${fmt.currency(o.totalAmount)}</td>
              <td>${badge(o.status)}</td>
              <td class="text-muted">${fmt.datetime(o.createdAt)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
  showModal(`${c.firstName} ${c.lastName}`, html, null, null);
}

// ─────────────────────────────────────────────────────────
// CATEGORIES  (full-page split-panel — no modal)
// ─────────────────────────────────────────────────────────
// Category names are fully defined by the admin — no hardcoded options.

// per-category image upload state (separate from product uploader)
const _catUploaderState = { imageUrl: null, isUploading: false };

async function renderCategories() {
  showLoading();
  try {
    // Load both categories and products in parallel so we can count products per category
    const [cats, prods] = await Promise.all([
      api.getCategories(),
      S.products.length ? Promise.resolve(S.products) : api.getAdminProducts(),
    ]);
    S.categories = cats || [];
    if (prods) S.products = prods;
    S.catPage = 1;
    _renderCategoriesPage();
  } catch (e) { toast('Failed to load categories: ' + e.message, 'error'); }
}

function _renderCategoriesPage(editingCat = null) {
  // hide the header "page-actions" button — we have our own inline form
  document.getElementById('page-actions').innerHTML = '';

  const isEdit = !!editingCat;

  // Build a product-count map: category name (lowercase) → count
  const productCountMap = {};
  S.products.forEach(p => {
    if (p.category) {
      const key = p.category.toLowerCase();
      productCountMap[key] = (productCountMap[key] || 0) + 1;
    }
  });

  const catCards = S.categories.map(c => {
    const count = productCountMap[c.name.toLowerCase()] || 0;
    return `
    <div class="cat-card" data-id="${c.id}">
      <div class="cat-card-img">
        ${c.imageUrl
        ? `<img src="${esc(c.imageUrl)}" alt="${esc(c.name)}">`
        : `<div class="cat-card-no-img">No Image</div>`}
      </div>
      <div class="cat-card-info">
        <span class="cat-card-name">${esc(c.name)}</span>
        <span class="badge ${c.active ? 'badge-success' : 'badge-neutral'} cat-card-badge">${c.active ? 'Active' : 'Inactive'}</span>
      </div>
      <div class="cat-product-count">
        <span class="cat-product-count-icon">📦</span>
        <span>${count} product${count !== 1 ? 's' : ''}</span>
      </div>
      <div class="cat-card-actions">
        <button class="btn btn-sm btn-secondary edit-cat-inline" data-id="${c.id}">Edit</button>
        <button class="btn btn-sm btn-danger del-cat-inline" data-id="${c.id}">Delete</button>
      </div>
    </div>`;
  }).join('') || `<p class="cat-empty-msg">No categories yet. Add your first one →</p>`;

  document.getElementById('content-body').innerHTML = `
    <div class="cat-page-layout">

      <!-- ── LEFT: Add / Edit Form ───────────────────────── -->
      <div class="cat-form-panel">
        <div class="cat-form-header">
          <h3 class="cat-form-title">${isEdit ? '✏️ Edit Category' : '➕ Add Category'}</h3>
          ${isEdit ? `<button class="btn btn-sm btn-secondary" id="cat-cancel-edit">Cancel</button>` : ''}
        </div>

        <form id="cat-inline-form" novalidate>
          <!-- Name text input -->
          <div class="form-group">
            <label class="form-label">Category Name <span class="form-required">*</span></label>
            <input class="form-input" id="cat-name-input" type="text"
              value="${esc(editingCat?.name || '')}"
              placeholder="e.g. Shoes, Watches, Perfumes…"
              autocomplete="off" required>
          </div>

          <!-- Image upload -->
          <div class="form-group">
            <label class="form-label">Category Image</label>
            <div class="cat-img-upload-wrap">
              <!-- Preview -->
              <div class="cat-img-preview" id="cat-img-preview">
                ${(editingCat?.imageUrl || _catUploaderState.imageUrl)
      ? `<img src="${esc(editingCat?.imageUrl || _catUploaderState.imageUrl)}" id="cat-img-preview-img" alt="preview">
                     <button type="button" class="cat-img-remove" id="cat-img-remove">×</button>`
      : ''}
              </div>
              <!-- Drop zone (hidden once image picked) -->
              <label class="cat-dropzone ${(editingCat?.imageUrl || _catUploaderState.imageUrl) ? 'hidden' : ''}" id="cat-dropzone" for="cat-file-input">
                <input type="file" id="cat-file-input" accept="image/*" class="upload-file-input">
                <div class="upload-dropzone-inner">
                  <span class="upload-icon">🖼️</span>
                  <span class="upload-hint">Drop image here or <u>browse</u></span>
                  <span class="upload-sub">Uploads to Cloudinary</span>
                </div>
              </label>
              <!-- Progress -->
              <div class="upload-progress-bar" id="cat-upload-bar" style="display:none">
                <div class="upload-progress-fill" id="cat-upload-fill"></div>
              </div>
            </div>
          </div>

          <!-- Active toggle -->
          <div class="form-group">
            <label class="form-checkbox-label">
              <input type="checkbox" id="cat-active-check" ${editingCat?.active !== false ? 'checked' : ''}> Active / Visible on store
            </label>
          </div>

          <button type="submit" class="btn btn-primary cat-submit-btn" id="cat-submit-btn">
            ${isEdit ? 'Update Category' : 'Create Category'}
          </button>
        </form>
      </div>

      <!-- ── RIGHT: Category Cards Grid ───────────────────── -->
      <div class="cat-grid-panel">
        <h3 class="cat-grid-title">All Categories <span class="cat-count-badge">${S.categories.length}</span></h3>
        <div class="cat-cards-grid">
          ${catCards}
        </div>
      </div>

    </div>`;

  // ── Init upload state ──────────────────────────────────
  if (editingCat?.imageUrl) {
    _catUploaderState.imageUrl = editingCat.imageUrl;
  } else if (!isEdit) {
    _catUploaderState.imageUrl = null;
  }

  // ── Image uploader logic ───────────────────────────────
  _initCatImageUploader(editingCat);

  // ── Cancel edit ───────────────────────────────────────
  const cancelBtn = document.getElementById('cat-cancel-edit');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    _catUploaderState.imageUrl = null;
    _renderCategoriesPage();
  });

  // ── Form submit ───────────────────────────────────────
  document.getElementById('cat-inline-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (_catUploaderState.isUploading) {
      toast('Please wait for the image upload to finish.', 'error');
      return;
    }
    const nameEl = document.getElementById('cat-name-input');
    const name = nameEl.value.trim();
    if (!name) { nameEl.classList.add('input-error'); toast('Please enter a category name', 'error'); return; }
    nameEl.classList.remove('input-error');

    if (!_catUploaderState.imageUrl) {
      toast('Please upload an image before creating.', 'error');
      return;
    }

    const btn = document.getElementById('cat-submit-btn');
    if (btn && btn.disabled) return;
    if (btn) { btn.disabled = true; btn.textContent = isEdit ? 'Updating…' : 'Creating…'; }

    try {
      const data = {
        name,
        imageUrl: _catUploaderState.imageUrl || null,
        active: document.getElementById('cat-active-check').checked,
      };
      if (isEdit) {
        const u = await api.updateCategory(editingCat.id, data);
        const i = S.categories.findIndex(c => c.id === editingCat.id);
        if (i !== -1) S.categories[i] = u;
        toast('Category updated ✓');
      } else {
        const created = await api.createCategory(data);
        S.categories.push(created);
        toast('Category created ✓');
      }
      _catUploaderState.imageUrl = null;
      _renderCategoriesPage();
    } catch (err) {
      toast('Error: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = isEdit ? 'Update Category' : 'Create Category'; }
    }
  });

  // ── Edit / Delete card buttons ─────────────────────────
  document.querySelectorAll('.edit-cat-inline').forEach(btn => btn.addEventListener('click', () => {
    const c = S.categories.find(c => c.id === btn.dataset.id);
    if (c) { _catUploaderState.imageUrl = c.imageUrl || null; _renderCategoriesPage(c); }
  }));
  document.querySelectorAll('.del-cat-inline').forEach(btn => btn.addEventListener('click', () => {
    const c = S.categories.find(c => c.id === btn.dataset.id);
    showConfirm(`Delete category "${c?.name}"?`, 'Delete Category', async () => {
      await api.deleteCategory(btn.dataset.id);
      S.categories = S.categories.filter(x => x.id !== btn.dataset.id);
      toast('Category deleted');
      _renderCategoriesPage();
    });
  }));
}

function _initCatImageUploader(editingCat = null) {
  const fileInput = document.getElementById('cat-file-input');
  const dropzone = document.getElementById('cat-dropzone');
  const preview = document.getElementById('cat-img-preview');
  const bar = document.getElementById('cat-upload-bar');
  const fill = document.getElementById('cat-upload-fill');

  function renderPreview(url) {
    _catUploaderState.imageUrl = url;
    preview.innerHTML = url
      ? `<img src="${url}" id="cat-img-preview-img" alt="preview">
         <button type="button" class="cat-img-remove" id="cat-img-remove">×</button>`
      : '';
    if (dropzone) dropzone.classList.toggle('hidden', !!url);
    const rm = document.getElementById('cat-img-remove');
    if (rm) rm.addEventListener('click', () => renderPreview(null));
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const submitBtn = document.getElementById('cat-submit-btn');
    const origText = submitBtn ? submitBtn.textContent : (editingCat ? 'Update Category' : 'Create Category');
    _catUploaderState.isUploading = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Uploading Image…';
    }
    if (dropzone) {
      const hint = dropzone.querySelector('.upload-hint');
      if (hint) hint.innerHTML = '<span style="color:#f39c12; font-weight:600;">⏳ Uploading to Cloudinary...</span>';
    }
    if (bar) bar.style.display = 'block';
    if (fill) fill.style.width = '30%';
    try {
      const url = await uploadToCloudinary(file, 'image', 'kicks-aura/categories');
      if (fill) fill.style.width = '100%';
      setTimeout(() => { if (bar) bar.style.display = 'none'; if (fill) fill.style.width = '0'; }, 400);
      renderPreview(url);
      _catUploaderState.isUploading = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
      if (dropzone) {
        const hint = dropzone.querySelector('.upload-hint');
        if (hint) hint.innerHTML = 'Drop image here or <u>browse</u>';
      }
      toast('Image uploaded ✓');
    } catch (err) {
      _catUploaderState.isUploading = false;
      if (bar) bar.style.display = 'none';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
      if (dropzone) {
        const hint = dropzone.querySelector('.upload-hint');
        if (hint) hint.innerHTML = 'Drop image here or <u>browse</u>';
      }
      toast('Upload failed: ' + err.message, 'error');
    }
  }

  if (fileInput) fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

  if (dropzone) {
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault(); dropzone.classList.remove('dragover');
      handleFile(e.dataTransfer.files[0]);
    });
  }

  // wire up remove button if image already loaded
  const rm = document.getElementById('cat-img-remove');
  if (rm) rm.addEventListener('click', () => renderPreview(null));
}

// Keep _renderCategoriesUI as alias for pagination compatibility
function _renderCategoriesUI() { _renderCategoriesPage(); }

// ─────────────────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────────────────
async function renderCoupons() {
  showLoading();
  try {
    S.coupons = await api.getCoupons() || [];
    S.couponPage = 1;
    _renderCouponsUI();
  } catch (e) { toast('Failed to load coupons: ' + e.message, 'error'); }
}

function _renderCouponsUI() {
  const total = S.coupons.length;
  const paged = paginate(S.coupons, S.couponPage, PER_PAGE);
  document.getElementById('page-actions').innerHTML = `<button class="btn btn-primary" id="btn-add-coupon">+ Add Coupon</button>`;

  document.getElementById('content-body').innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${paged.length === 0
      ? `<tr><td colspan="6" class="empty-row">No coupons yet — add one!</td></tr>`
      : paged.map(c => {
        const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
        return `<tr>
                    <td><code class="coupon-code">${esc(c.code)}</code></td>
                    <td><strong>${c.discountType === 'PER_PRODUCT' ? `₹${c.discountAmount} per product` : `${c.discountPercent}% off`}</strong></td>
                    <td>${c.minOrderValue ? fmt.currency(c.minOrderValue) : '—'}</td>
                    <td class="${expired ? 'text-danger' : ''}">${fmt.date(c.expiryDate)}</td>
                    <td>${expired
            ? '<span class="badge badge-danger">Expired</span>'
            : `<span class="badge ${c.active ? 'badge-success' : 'badge-neutral'}">${c.active ? 'Active' : 'Inactive'}</span>`}
                    </td>
                    <td><div class="action-btns">
                      <button class="btn-icon btn-icon--edit edit-coupon" data-id="${c.id}" title="Edit">${iconEdit()}</button>
                      <button class="btn-icon btn-icon--delete del-coupon" data-id="${c.id}" title="Delete">${iconTrash()}</button>
                    </div></td>
                  </tr>`;
      }).join('')}
          </tbody>
        </table>
      </div>
      ${pagination(total, S.couponPage, PER_PAGE)}
    </div>`;

  document.getElementById('btn-add-coupon').addEventListener('click', () => showCouponForm());
  document.querySelectorAll('.edit-coupon').forEach(btn => btn.addEventListener('click', () => {
    const c = S.coupons.find(c => c.id === btn.dataset.id); if (c) showCouponForm(c);
  }));
  document.querySelectorAll('.del-coupon').forEach(btn => btn.addEventListener('click', () => {
    const c = S.coupons.find(c => c.id === btn.dataset.id);
    showConfirm(`Delete coupon "${c?.code}"?`, 'Delete Coupon', async () => {
      await api.deleteCoupon(btn.dataset.id);
      S.coupons = S.coupons.filter(c => c.id !== btn.dataset.id);
      toast('Coupon deleted');
      _renderCouponsUI();
    });
  }));
  bindPagination(document.getElementById('content-body'), p => { S.couponPage = p; _renderCouponsUI(); });
}

function showCouponForm(coupon = null) {
  const isEdit = !!coupon;
  const currentType = coupon?.discountType || 'PERCENTAGE';
  const html = `<form id="coupon-form">
    <div class="form-group">
      <label class="form-label">Coupon Code *</label>
      <input class="form-input" name="code" value="${esc(coupon?.code || '')}" required
             placeholder="e.g. SAVE20" style="text-transform:uppercase;font-family:monospace">
      <small class="form-hint">Will be auto-uppercased</small>
    </div>

    <div class="form-group">
      <label class="form-label">Discount Type *</label>
      <div style="display:flex;gap:12px;margin-top:6px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
          <input type="radio" name="discountType" value="PERCENTAGE" ${currentType === 'PERCENTAGE' ? 'checked' : ''}>
          Percentage (% off)
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
          <input type="radio" name="discountType" value="PER_PRODUCT" ${currentType === 'PER_PRODUCT' ? 'checked' : ''}>
          Per Product (₹ off per item)
        </label>
      </div>
    </div>

    <div class="form-grid-2">
      <div class="form-group" id="field-percent" style="${currentType === 'PER_PRODUCT' ? 'display:none;' : ''}">
        <label class="form-label">Discount (%) *</label>
        <input type="number" class="form-input" name="disc" value="${coupon?.discountPercent || ''}" min="1" max="100" step="0.1">
      </div>
      <div class="form-group" id="field-amount" style="${currentType === 'PERCENTAGE' ? 'display:none;' : ''}">
        <label class="form-label">Discount Amount (₹ per product) *</label>
        <input type="number" class="form-input" name="discAmt" value="${coupon?.discountAmount || ''}" min="1" step="1" placeholder="e.g. 200">
      </div>
      <div class="form-group">
        <label class="form-label">Min Order Value (₹)</label>
        <input type="number" class="form-input" name="minVal" value="${coupon?.minOrderValue || ''}" min="0" step="1" placeholder="No minimum">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Expiry Date</label>
      <input type="date" class="form-input" name="expiry" value="${coupon?.expiryDate || ''}">
    </div>
    <div class="form-group">
      <label class="form-checkbox-label">
        <input type="checkbox" name="active" ${coupon?.active !== false ? 'checked' : ''}> Active
      </label>
    </div>
  </form>`;

  showModal(isEdit ? 'Edit Coupon' : 'Add Coupon', html, isEdit ? 'Update' : 'Create', async () => {
    const f = document.getElementById('coupon-form');
    const discountType = f.querySelector('[name="discountType"]:checked')?.value || 'PERCENTAGE';
    const data = {
      code: f.querySelector('[name="code"]').value.trim().toUpperCase(),
      discountType,
      discountPercent: discountType === 'PERCENTAGE' ? (parseFloat(f.querySelector('[name="disc"]').value) || 0) : 0,
      discountAmount: discountType === 'PER_PRODUCT' ? (parseFloat(f.querySelector('[name="discAmt"]').value) || 0) : 0,
      minOrderValue: parseFloat(f.querySelector('[name="minVal"]').value) || null,
      expiryDate: f.querySelector('[name="expiry"]').value || null,
      active: f.querySelector('[name="active"]').checked,
    };
    if ((discountType === 'PERCENTAGE' && !data.discountPercent) ||
        (discountType === 'PER_PRODUCT' && !data.discountAmount)) {
      toast('Please enter a discount value', 'error');
      return false; // keep modal open
    }
    if (isEdit) {
      const u = await api.updateCoupon(coupon.id, data);
      const i = S.coupons.findIndex(c => c.id === coupon.id);
      if (i !== -1) S.coupons[i] = u;
      toast('Coupon updated');
    } else {
      S.coupons.push(await api.createCoupon(data));
      toast('Coupon created');
    }
    hideModal(); _renderCouponsUI();
  });

  // Wire up the type toggle AFTER the modal renders
  requestAnimationFrame(() => {
    document.querySelectorAll('[name="discountType"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const isPP = radio.value === 'PER_PRODUCT';
        document.getElementById('field-percent').style.display = isPP ? 'none' : '';
        document.getElementById('field-amount').style.display = isPP ? '' : 'none';
      });
    });
  });
}

// ─────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────
async function renderReviews() {
  showLoading();
  try {
    S.reviews = await api.getReviews() || [];
    _renderReviewsUI();
  } catch (e) {
    document.getElementById('content-body').innerHTML = `<div class="error-state">Error loading reviews: ${esc(e.message)}</div>`;
  }
}

function _renderReviewsUI() {
  const container = document.getElementById('content-body');
  document.getElementById('page-actions').innerHTML = `
    <button class="btn btn-primary" id="btn-add-review">+ Add Review</button>`;

  const pageItems = paginate(S.reviews, S.reviewPage, PER_PAGE);
  const rows = pageItems.map(r => `
    <tr>
      <td><img src="${esc(r.imageUrl)}" class="table-img" style="object-fit:cover;width:120px;height:auto"></td>
      <td>${fmt.datetime(r.createdAt)}</td>
      <td class="table-actions">
        <button class="icon-btn del-review" data-id="${r.id}" title="Delete">${iconTrash()}</button>
      </td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Image</th><th>Date Added</th><th width="100">Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="3" class="text-center text-muted">No reviews found</td></tr>'}</tbody>
        </table>
      </div>
      ${pagination(S.reviews.length, S.reviewPage, PER_PAGE)}
    </div>`;

  document.getElementById('btn-add-review').addEventListener('click', () => showReviewForm());
  document.querySelectorAll('.del-review').forEach(btn => btn.addEventListener('click', () => {
    showConfirm('Delete this review image?', 'Delete Review', async () => {
      await api.deleteReview(btn.dataset.id);
      S.reviews = S.reviews.filter(r => r.id !== btn.dataset.id);
      toast('Review deleted');
      _renderReviewsUI();
    });
  }));
  bindPagination(container, p => { S.reviewPage = p; _renderReviewsUI(); });
}

function showReviewForm() {
  _uploaderState['new-review'] = [];
  _uploaderState['isUploading_new-review'] = false;
  _uploaderState.activeUploads = 0;
  const html = `
    <div class="form-group">
      <label class="form-label">Review Image *</label>
      <div id="review-image-upload"></div>
    </div>`;

  showModal('Add Customer Review', html, 'Save', async () => {
    if (_uploaderState.activeUploads > 0 || _uploaderState['isUploading_new-review']) {
      throw new Error('Please wait for the image upload to finish.');
    }
    const urls = _uploaderState['new-review'];
    if (!urls.length) {
      throw new Error('Please upload an image before creating.');
    }

    // Upload all selected images
    for (const url of urls) {
      const created = await api.createReview({ imageUrl: url });
      S.reviews.unshift(created); // Add to beginning
    }
    toast(`${urls.length} review(s) added`);
    hideModal();
    _renderReviewsUI();
  });

  // Initialize the Cloudinary uploader widget
  setTimeout(() => {
    initMediaUploader('review-image-upload', 'new-review', 'image', 'image/*', 'kicks-aura/reviews');
  }, 10);
}

// ── Icon Helpers ───────────────────────────────────────────
const iconEdit = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const iconCopy = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const iconTrash = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const iconX = () => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// ── Init ───────────────────────────────────────────────────
import { isLoggedIn, getAuthUser, logout } from './auth.js';
import { openAdminLoginModal } from './login-modal.js';

function init() {
  const user = getAuthUser();
  if (!isLoggedIn() || !user || user.role !== 'ROLE_ADMIN') {
    openAdminLoginModal();
    return; // block further initialization
  }

  document.getElementById('admin-layout').style.display = 'flex'; // admin-layout uses flex in CSS

  // Sidebar nav
  document.querySelectorAll('.nav-item[data-section]').forEach(item =>
    item.addEventListener('click', e => { e.preventDefault(); navigate(item.dataset.section); }));

  // Modal close
  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });

  // Confirm
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    _confirmCb = null;
  });
  document.getElementById('confirm-ok').addEventListener('click', async () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    if (_confirmCb) { try { await _confirmCb(); } catch (e) { toast(e.message, 'error'); } _confirmCb = null; }
  });

  // Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Expose globals for inline onclick in order detail modal footer
  window.hideModal = hideModal;
  window.showReceiptModal = showReceiptModal;
  window.navigate = navigate;
  window.S = S;

  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
