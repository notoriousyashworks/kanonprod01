/* ============================================
   Checkout Page Logic (Live cart + API)
   ============================================ */
import { getCartItems, getCartTotal, clearCart, removeFromCart, updateQuantity, updateCartBadge } from './cart.js';
import { checkout, saveAddressToBackend } from './api.js';
import { formatCloudinaryUrl } from './ui.js';
import { lookupPinCode } from './pin-lookup.js?v=1.1';
import { getProfile, saveProfile } from './profile.js?v=1.3';
import { isLoggedIn, getAuthUser, setAuthUser } from './auth.js';
import { openLoginModal } from './login-modal.js?v=1.7';
import { shippingPolicyContent } from './policy-content.js';

const form = document.getElementById('checkout-form');
const placeOrderBtn = document.getElementById('place-order-btn');
const applyBtn = document.querySelector('.btn-apply');
const MAX_SAVED_ADDRESSES = 10;
const ADDRESS_LIMIT_MESSAGE = 'Max address limit reached. Delete one address first to add a new address.';

function hasDisplaySize(size) {
  const value = String(size ?? '').trim();
  return value && value.toLowerCase() !== 'one size' && value.toLowerCase() !== 'n/a';
}
let editingAddressIndex = -1;

function cleanText(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ');
}

function normalizeLocation(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(nct|national capital territory|district|division)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDelhiValue(value) {
  const normalized = normalizeLocation(value);
  return normalized === 'delhi' || normalized === 'new delhi' || normalized.includes(' delhi');
}

function isDelhiLocation(city, state) {
  return isDelhiValue(state) || isDelhiValue(city);
}

function locationMatches(inputCity, inputState, pinCity, pinState) {
  const city = normalizeLocation(inputCity);
  const state = normalizeLocation(inputState);
  const verifiedCity = normalizeLocation(pinCity);
  const verifiedState = normalizeLocation(pinState);

  if (!city || !state || !verifiedCity || !verifiedState) return false;
  if (isDelhiLocation(city, state) && isDelhiLocation(verifiedCity, verifiedState)) return true;

  const stateMatches = state === verifiedState || (isDelhiValue(state) && isDelhiValue(verifiedState));
  const cityMatches = city === verifiedCity || city.includes(verifiedCity) || verifiedCity.includes(city);
  return stateMatches && cityMatches;
}

function getCheckoutName(user = checkoutUser || getAuthUser()) {
  const profile = getProfile() || {};
  const hasProfileName = profile.firstName !== undefined || profile.lastName !== undefined;
  const first = cleanText(hasProfileName ? profile.firstName : user?.firstName);
  const last = cleanText(hasProfileName ? profile.lastName : user?.lastName);
  return [first, last].filter(Boolean).join(' ') || 'Your Profile';
}

function getAddressDisplayName(address = {}, user = checkoutUser || getAuthUser()) {
  const profile = getProfile() || {};
  const hasAddressName = address.firstName !== undefined || address.lastName !== undefined;
  const hasProfileName = profile.firstName !== undefined || profile.lastName !== undefined;
  const first = cleanText(hasAddressName ? address.firstName : (hasProfileName ? profile.firstName : user?.firstName));
  const last = cleanText(hasAddressName ? address.lastName : (hasProfileName ? profile.lastName : user?.lastName));
  return [first, last].filter(Boolean).join(' ') || getCheckoutName(user);
}

function normalizeSavedAddresses(addresses) {
  return Array.isArray(addresses) ? addresses.slice(0, MAX_SAVED_ADDRESSES) : [];
}


function syncCheckoutAddresses(addresses) {
  // Do NOT truncate here — preserve all backend addresses as-is.
  const all = Array.isArray(addresses) ? addresses : [];
  if (!checkoutUser) checkoutUser = getAuthUser() || {};
  checkoutUser.addresses = all;
  const authUser = getAuthUser();
  if (authUser) {
    authUser.addresses = all;
    setAuthUser(authUser);
  }
  saveProfile({ addresses: all });
  return all;
}

function getLimitedCheckoutAddresses() {
  const rawAddresses = Array.isArray(checkoutUser?.addresses) ? checkoutUser.addresses : [];
  // Return all addresses without truncating or writing back.
  if (checkoutUser) {
    checkoutUser.addresses = rawAddresses;
  }
  return rawAddresses;
}

function isSameAddress(a = {}, b = {}) {
  return cleanText(a.pinCode) === cleanText(b.pinCode)
    && cleanText(a.houseNumberOrAddress || a.address).toLowerCase() === cleanText(b.houseNumberOrAddress || b.address).toLowerCase();
}

async function validatePinAgainstAddress({ pinCode, city, state }) {
  const pin = cleanText(pinCode).replace(/\D/g, '').slice(0, 6);
  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: 'PIN code must be exactly 6 digits.' };
  }
  return { success: true, city, state, pinCode: pin };
}

// ─── Render Cart Items in Summary ────────────────────────────────────────────
function renderCartSummary() {
  const items = getCartItems();
  const summaryList = document.getElementById('summary-items-list');

  if (!summaryList) return;

  if (items.length === 0) {
    summaryList.innerHTML = `
      <div style="text-align:center; padding:32px 0; color:#6b7280; font-size:14px;">
        <div style="font-size:40px; margin-bottom:12px;">🛒</div>
        <p style="font-weight:600; color:#374151; margin-bottom:8px;">Your cart is empty</p>
        <a href="/products" style="color:#2563eb; font-weight:600;">Browse products →</a>
      </div>`;
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.style.opacity = '0.5';
    }
    return;
  }

  // Re-enable place order btn
  if (placeOrderBtn) {
    placeOrderBtn.disabled = false;
    placeOrderBtn.style.opacity = '1';
  }

  summaryList.innerHTML = items.map(item => {
    const imageUrl = item.productImage ? formatCloudinaryUrl(item.productImage) : '';
    const itemTotal = (item.price * item.quantity).toLocaleString('en-IN');
    const sizeLine = hasDisplaySize(item.size)
      ? `<p class="summary-item-size">${item.size}</p>`
      : '';
    const videoCallLabel = item.liveVideoCall
      ? `<div style="margin-top: 4px; margin-bottom: 8px; font-size: 11px; color: #16a34a; display: flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Video call before dispatch</div>`
      : '';

    return `
      <div class="summary-item" data-product-id="${item.productId}" data-variant-id="${item.variantId ?? ''}">
        <div class="summary-item-img" data-qty="${item.quantity}">
          ${imageUrl
            ? `<img src="${imageUrl}" alt="${item.productName}" />`
            : `<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:24px;">👟</div>`
          }
        </div>
        <div class="summary-item-details">
          <p class="summary-item-name">${item.productName}</p>
          ${sizeLine}
          ${videoCallLabel}
          <div class="summary-item-controls">
            <div class="summary-qty-stepper">
              <button class="summary-qty-btn summary-qty-minus"
                data-pid="${item.productId}" data-vid="${item.variantId ?? ''}" aria-label="Decrease">−</button>
              <span class="summary-qty-val">${item.quantity}</span>
              <button class="summary-qty-btn summary-qty-plus"
                data-pid="${item.productId}" data-vid="${item.variantId ?? ''}" aria-label="Increase">+</button>
            </div>
            <button class="summary-remove-btn"
              data-pid="${item.productId}" data-vid="${item.variantId ?? ''}" aria-label="Remove item">Remove</button>
          </div>
        </div>
        <div class="summary-item-price">₹${itemTotal}</div>
      </div>`;
  }).join('');

  // ── Quantity minus ──────────────────────────────────────────────────────────
  summaryList.querySelectorAll('.summary-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getCartItems().find(
        i => i.productId === btn.dataset.pid && String(i.variantId ?? '') === String(btn.dataset.vid)
      );
      if (!item) return;
      if (item.quantity <= 1) {
        removeFromCart(item.productId, item.size);
      } else {
        updateQuantity(item.productId, item.size, item.quantity - 1);
      }
      updateCartBadge();
      renderCartSummary();
      calculateTotals();
    });
  });

  // ── Quantity plus ───────────────────────────────────────────────────────────
  summaryList.querySelectorAll('.summary-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getCartItems().find(
        i => i.productId === btn.dataset.pid && String(i.variantId ?? '') === String(btn.dataset.vid)
      );
      if (!item) return;
      updateQuantity(item.productId, item.size, item.quantity + 1);
      updateCartBadge();
      renderCartSummary();
      calculateTotals();
    });
  });

  // ── Remove ──────────────────────────────────────────────────────────────────
  summaryList.querySelectorAll('.summary-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getCartItems().find(
        i => i.productId === btn.dataset.pid && String(i.variantId ?? '') === String(btn.dataset.vid)
      );
      if (!item) return;
      removeFromCart(item.productId, item.size);
      updateCartBadge();
      renderCartSummary();
      calculateTotals();
    });
  });
}

// ─── Totals Calculation ───────────────────────────────────────────────────────
function calculateTotals() {
  const items = getCartItems();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let shipping = 0;
  let discount = 0;

  const selectedPayment = document.querySelector('.co-payment-option input[type="radio"]:checked, .payment-option input[type="radio"]:checked')?.value;
  const subtitleEl = document.getElementById('place-order-subtitle');

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  if (selectedPayment === 'prepaid') {
    discount = totalUnits * 200; // ₹200 flat off per product
    shipping = 0;
  } else if (selectedPayment === 'cod') {
    discount = 0;
    shipping = totalUnits * 99;
  }

  const codDescEl = document.querySelector('#pay-cod-label .co-payment-desc');
  if (codDescEl) {
    const codAdvance = totalUnits > 0 ? (totalUnits * 99) : 99;
    codDescEl.textContent = `₹${codAdvance.toLocaleString('en-IN')} advance collected by Captain via WhatsApp`;
  }

  const total = subtotal - discount + shipping;

  if (selectedPayment === 'prepaid') {
    if (subtitleEl) subtitleEl.textContent = `Captain will connect over WhatsApp to collect ₹${total.toLocaleString('en-IN')}`;
  } else if (selectedPayment === 'cod') {
    if (subtitleEl) subtitleEl.textContent = `Captain will connect over WhatsApp to collect ₹${shipping.toLocaleString('en-IN')} advance`;
  }

  // Update DOM
  const subtotalEl = document.getElementById('summary-subtotal');
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

  const discountRow = document.getElementById('summary-discount-row');
  if (discountRow) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      const discountEl = document.getElementById('summary-discount');
      if (discountEl) discountEl.textContent = `-₹${discount.toLocaleString('en-IN')}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  const shippingEl = document.getElementById('summary-shipping');
  if (shippingEl) {
    if (shipping === 0) {
      shippingEl.textContent = 'Free';
    } else {
      shippingEl.textContent = `₹${shipping.toLocaleString('en-IN')}`;
    }
  }

  const totalEl = document.getElementById('summary-total');
  if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
renderCartSummary();
calculateTotals();

// ─── Payment Radio Listeners ──────────────────────────────────────────────────
const paymentOptions = document.querySelectorAll('.co-payment-option input[type="radio"], .payment-option input[type="radio"]');
paymentOptions.forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.co-payment-option, .payment-option').forEach(opt => opt.classList.remove('co-payment-option--selected'));
    document.querySelectorAll('.radio-custom').forEach(rc => rc.classList.remove('checked'));
    if (radio.checked) {
      radio.closest('.co-payment-option, .payment-option')?.classList.add('co-payment-option--selected');
      radio.nextElementSibling?.classList.add('checked');
      calculateTotals();
    }
  });
});

// ─── PIN Code Auto-Detection ──────────────────────────────────────────────────
const pinInput = document.getElementById('pinCode');
const cityInput = document.getElementById('city');
const stateInput = document.getElementById('state');
const cityEl = cityInput;
const stateEl = stateInput;
const pinSpinner = document.getElementById('pin-spinner');
const pinStatus = document.getElementById('pin-status');

let lastLookedUpPin = '';
let pinDebounceTimer = null;

if (pinInput) {
  pinInput.addEventListener('input', (e) => {
    // 1. Enforce numeric-only and 6 digits max
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (e.target.value !== cleaned) {
      e.target.value = cleaned;
    }
  });
}

// ─── Contact Phone Sanitization ──────────────────────────────────────────────
const contactPhoneInput = document.getElementById('contactPhone');
if (contactPhoneInput) {
  contactPhoneInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('91') && val.length === 12) {
      val = val.slice(2);
    }
    if (val.length > 10) {
      val = val.slice(0, 10);
    }
    if (e.target.value !== val) {
      e.target.value = val;
    }
  });
}

// ─── Coupon (placeholder) ─────────────────────────────────────────────────────
if (applyBtn) {
  applyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Coupon applied successfully!');
  });
}

// ─── Order Confirmation Modal ──────────────────────────────────────────────────
const overlay     = document.getElementById('order-confirm-overlay');
const progressBar = document.getElementById('order-confirm-progress');
const countdownEl = document.getElementById('order-confirm-countdown');

function showOrderConfirmation() {
  overlay.classList.add('visible');

  const TOTAL = 5;
  let remaining = TOTAL;
  countdownEl.textContent = `Redirecting you in ${remaining} second${remaining !== 1 ? 's' : ''}…`;

  const ticker = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(ticker);
      countdownEl.textContent = 'Redirecting you now…';
    } else {
      countdownEl.textContent = `Redirecting you in ${remaining} second${remaining !== 1 ? 's' : ''}…`;
    }
  }, 1000);

  setTimeout(() => {
    window.location.href = '/orders';
  }, TOTAL * 1000);
}

// ─── Logged-In Checkout UI State ─────────────────────────────────────────────
let selectedSavedAddressIndex = -1;
let checkoutUser = null;

function renderSavedAddresses() {
  const shippingForm = document.getElementById('shipping-form-container');
  const savedAddresses = document.getElementById('saved-addresses-container');
  const savedList = document.getElementById('saved-addresses-list');
  if (!checkoutUser || !savedList) return;

  const addresses = getLimitedCheckoutAddresses();

  savedList.innerHTML = '';

  if (addresses.length === 0) {
    selectedSavedAddressIndex = -1;
    if (shippingForm) shippingForm.style.display = 'block';
    if (savedAddresses) savedAddresses.style.display = 'none';
    return;
  }

  if (shippingForm) shippingForm.style.display = 'none';
  if (savedAddresses) savedAddresses.style.display = 'block';

  selectedSavedAddressIndex = Math.min(Math.max(selectedSavedAddressIndex, 0), addresses.length - 1);

  addresses.forEach((addr, i) => {
    const card = document.createElement('div');
    card.className = 'co-address-card' + (i === selectedSavedAddressIndex ? ' selected' : '');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Edit saved address');
    card.innerHTML = `
      <div class="co-address-name">${getAddressDisplayName(addr, checkoutUser)}</div>
      <div class="co-address-text">${addr.houseNumberOrAddress}, ${addr.landmark ? addr.landmark + ', ' : ''}${addr.city}, ${addr.state}, ${addr.pinCode}</div>
      ${i === 0 ? '<div class="co-address-default-badge">Default</div>' : ''}
    `;
    const selectAndEdit = () => {
      document.querySelectorAll('.co-address-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedSavedAddressIndex = i;
      openAddressModal(i);
    };
    card.addEventListener('click', selectAndEdit);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectAndEdit();
      }
    });
    savedList.appendChild(card);
  });
}

window.addEventListener('auth-changed', (e) => {
  const contactForm = document.getElementById('contact-form-container');
  const contactSummary = document.getElementById('contact-summary-container');

  const latestUser = e.detail?.user || getAuthUser();

  if ((e.detail?.loggedIn || latestUser) && latestUser) {
    // Show the checkout page
    document.querySelector('.co-wrap')?.classList.add('auth-ready');

    checkoutUser = latestUser;
    
    // Contact Section
    if (contactForm && contactSummary) {
      contactForm.style.display = 'none';
      contactSummary.style.display = 'flex';
      const initial = checkoutUser.firstName ? checkoutUser.firstName.charAt(0).toUpperCase() : '👤';
      contactSummary.innerHTML = `
        <div class="co-avatar">${initial}</div>
        <div class="co-summary-text">+91 ${checkoutUser.phoneNumber}</div>
      `;
    }

    renderSavedAddresses();
  }
});

// ─── Add Address Modal Toggles ───────────────────────────────────────────────
const addAddressBtn = document.getElementById('add-new-address-btn');
const addAddressModalOverlay = document.getElementById('add-address-modal-overlay');
const addAddressClose = document.getElementById('add-address-close');
const addAddressCancel = document.getElementById('add-address-cancel');
const addAddressSave = document.getElementById('add-address-save');

function setModalField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function openAddressModal(index = -1) {
  const addresses = getLimitedCheckoutAddresses();
  if (index < 0 && addresses.length >= MAX_SAVED_ADDRESSES) {
    alert(ADDRESS_LIMIT_MESSAGE);
    return;
  }

  editingAddressIndex = index;
  const addr = index >= 0 ? addresses[index] : {};
  const profile = getProfile() || {};
  const modalTitle = document.querySelector('#add-address-modal-overlay .address-modal-title');
  if (modalTitle) modalTitle.textContent = index >= 0 ? 'Edit address' : 'Add address';
  if (addAddressSave) addAddressSave.textContent = index >= 0 ? 'Update address' : 'Save address';

  const hasAddressName = addr.firstName !== undefined || addr.lastName !== undefined;
  setModalField('new-firstName', hasAddressName ? addr.firstName : profile.firstName || checkoutUser?.firstName || '');
  setModalField('new-lastName', hasAddressName ? addr.lastName : profile.lastName || checkoutUser?.lastName || '');
  setModalField('new-address', addr.houseNumberOrAddress || '');
  setModalField('new-landmark', addr.landmark || '');
  setModalField('new-city', addr.city || '');
  setModalField('new-state', addr.state || '');
  setModalField('new-pinCode', addr.pinCode || '');

  if (addAddressModalOverlay) addAddressModalOverlay.style.display = 'flex';
}

if (addAddressBtn) {
  addAddressBtn.addEventListener('click', () => {
    const addresses = getLimitedCheckoutAddresses();
    if (addresses.length >= MAX_SAVED_ADDRESSES) {
      alert(ADDRESS_LIMIT_MESSAGE);
      return;
    }
    openAddressModal(-1);
  });
}
const closeAddModal = () => {
  editingAddressIndex = -1;
  if (addAddressModalOverlay) addAddressModalOverlay.style.display = 'none';
};
if (addAddressClose) addAddressClose.addEventListener('click', closeAddModal);
if (addAddressCancel) addAddressCancel.addEventListener('click', closeAddModal);

// Add Address Modal PIN Auto-fill logic
const newPinInput = document.getElementById('new-pinCode');
const newCityInput = document.getElementById('new-city');
const newStateInput = document.getElementById('new-state');
const newPinSpinner = document.getElementById('new-pin-spinner');

if (newPinInput) {
  newPinInput.addEventListener('input', (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (e.target.value !== cleaned) e.target.value = cleaned;
  });
}

if (addAddressSave) {
  addAddressSave.addEventListener('click', async () => {
    // Add logic to save address to profile and re-render
    const fName = document.getElementById('new-firstName')?.value.trim();
    const lName = document.getElementById('new-lastName')?.value.trim();
    const addr = document.getElementById('new-address')?.value.trim();
    const lmark = document.getElementById('new-landmark')?.value.trim();
    const cty = document.getElementById('new-city')?.value.trim();
    const st = document.getElementById('new-state')?.value.trim();
    const pin = document.getElementById('new-pinCode')?.value.trim();
    
    const modalFields = [
      { id: 'new-firstName', errorId: 'new-firstNameError' },
      { id: 'new-address', errorId: 'new-addressError' },
      { id: 'new-city', errorId: 'new-cityError' },
      { id: 'new-state', errorId: 'new-stateError' },
      { id: 'new-pinCode', errorId: 'new-pinCodeError' }
    ];

    for (const field of modalFields) {
      const el = document.getElementById(field.id);
      if (el) el.style.borderColor = '';
      const err = document.getElementById(field.errorId);
      if (err) {
        err.style.display = 'none';
        err.textContent = 'This is required';
      }
    }

    const showErrorAndFocus = (id, errId, msg) => {
      const el = document.getElementById(id);
      const err = document.getElementById(errId);
      if (el) {
        el.style.borderColor = '#ef4444';
        el.focus();
      }
      if (err) {
        err.style.display = 'block';
        if (msg) err.textContent = msg;
      } else {
        alert(msg || 'This field is required.');
      }
    };

    if (!fName) { showErrorAndFocus('new-firstName', 'new-firstNameError'); return; }
    if (!addr) { showErrorAndFocus('new-address', 'new-addressError'); return; }
    if (!cty) { showErrorAndFocus('new-city', 'new-cityError'); return; }
    if (!st) { showErrorAndFocus('new-state', 'new-stateError'); return; }
    if (!pin) { showErrorAndFocus('new-pinCode', 'new-pinCodeError'); return; }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      showErrorAndFocus('new-pinCode', 'new-pinCodeError', 'Must be exactly 6 digits.'); return;
    }
    
    if (checkoutUser) {
      const addresses = getLimitedCheckoutAddresses();
      if (editingAddressIndex < 0 && addresses.length >= MAX_SAVED_ADDRESSES) {
        alert(ADDRESS_LIMIT_MESSAGE);
        return;
      }

      const nextAddress = {
        firstName: fName,
        lastName: lName,
        houseNumberOrAddress: addr,
        landmark: lmark,
        city: cty,
        state: st,
        pinCode: pin
      };

      if (editingAddressIndex >= 0) {
        addresses[editingAddressIndex] = nextAddress;
        selectedSavedAddressIndex = editingAddressIndex;
      } else {
        addresses.push(nextAddress);
        selectedSavedAddressIndex = addresses.length - 1;
      }

      syncCheckoutAddresses(addresses);
      renderSavedAddresses();
    }
    closeAddModal();
  });
}

// ─── Place Order ──────────────────────────────────────────────────────────────
if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!isLoggedIn()) {
      openLoginModal({ context: 'checkout' });
      return;
    }

    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Collect form values
    let phone, fName, lName, address, landmark, city, state, pinCode;
    const savedAddressesForOrder = getLimitedCheckoutAddresses();
    const isUsingSavedAddress = (savedAddressesForOrder.length > 0 && selectedSavedAddressIndex >= 0);

    if (isUsingSavedAddress) {
      const profile = getProfile() || {};
      phone = checkoutUser.phoneNumber;
      const addr = savedAddressesForOrder[selectedSavedAddressIndex];
      const hasAddressName = addr.firstName !== undefined || addr.lastName !== undefined;
      const hasProfileName = profile.firstName !== undefined || profile.lastName !== undefined;
      fName = cleanText(hasAddressName ? addr.firstName : (hasProfileName ? profile.firstName : checkoutUser.firstName));
      lName = cleanText(hasAddressName ? addr.lastName : (hasProfileName ? profile.lastName : checkoutUser.lastName));
      address = addr.houseNumberOrAddress;
      landmark = addr.landmark || '';
      city = addr.city;
      state = addr.state;
      pinCode = addr.pinCode;
    } else {
      phone     = form.contactPhone?.value?.trim();
      if (checkoutUser && checkoutUser.phoneNumber) {
        phone = checkoutUser.phoneNumber; // Force logged in user's phone
      }
      fName     = form.firstName?.value?.trim();
      lName     = form.lastName?.value?.trim();
      address   = form.address?.value?.trim();
      landmark  = form.landmark?.value?.trim() || '';
      city      = form.city?.value?.trim();
      state     = form.state?.value?.trim();
      pinCode   = form.pinCode?.value?.trim();
    }

    // Reset inline errors
    const mainFields = [
      { id: 'firstName', errorId: 'firstNameError' },
      { id: 'address', errorId: 'addressError' },
      { id: 'city', errorId: 'cityError' },
      { id: 'state', errorId: 'stateError' },
      { id: 'pinCode', errorId: 'pinCodeError' }
    ];

    if (!isUsingSavedAddress && form) {
      for (const field of mainFields) {
        if (form[field.id]) form[field.id].style.borderColor = '';
        const err = document.getElementById(field.errorId);
        if (err) {
          err.style.display = 'none';
          err.textContent = 'This is required';
        }
      }
    }

    const showMainErrorAndFocus = (id, errId, msg) => {
      if (!isUsingSavedAddress && form && form[id]) {
        form[id].style.borderColor = '#ef4444';
        form[id].focus();
        const err = document.getElementById(errId);
        if (err) {
          err.style.display = 'block';
          if (msg) err.textContent = msg;
        }
      } else {
        alert(msg || 'This field is required.');
      }
    };

    // Validate required basic fields
    if (!phone) { alert('Please enter your phone number.'); return; }
    if (!/^\d{10}$/.test(phone)) { alert('Phone number must be exactly 10 digits.'); return; }
    if (!fName) { showMainErrorAndFocus('firstName', 'firstNameError'); return; }
    // lName is no longer required
    if (!address) { showMainErrorAndFocus('address', 'addressError'); return; }
    if (!city) { showMainErrorAndFocus('city', 'cityError'); return; }
    if (!state) { showMainErrorAndFocus('state', 'stateError'); return; }
    if (!pinCode) { showMainErrorAndFocus('pinCode', 'pinCodeError'); return; }
    if (!/^\d{6}$/.test(pinCode)) { showMainErrorAndFocus('pinCode', 'pinCodeError', 'Must be exactly 6 digits.'); return; }

    // Final PIN assignment
    if (isUsingSavedAddress) {
      if (cityInput) cityInput.value = city;
      if (stateInput) stateInput.value = state;
    }

    if (!city) { alert('Please enter your city.'); return; }
    if (!state) { alert('Please enter your state.'); return; }

    const selectedPayment = document.querySelector('.co-payment-option input[type="radio"]:checked, .payment-option input[type="radio"]:checked')?.value || 'prepaid';

    // Build the request payload matching CheckoutRequestDTO
    const orderPayload = {
      phoneNumber: phone,
      firstName: fName,
      lastName: lName,
      paymentMethod: selectedPayment,
      shippingAddress: {
        firstName: fName,
        lastName: lName,
        houseNumberOrAddress: address,
        landmark: landmark,
        city: city,
        state: state,
        pinCode: pinCode,
      },
      items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          liveVideoCall: item.liveVideoCall || false,
        })),
    };

    if (orderPayload.items.length === 0) {
      alert('Your cart is empty. Please add a product before placing the order.');
      return;
    }

    // Visual feedback
    placeOrderBtn.querySelector('.btn-main-text').textContent = 'PROCESSING…';
    placeOrderBtn.style.opacity = '0.8';
    placeOrderBtn.disabled = true;

    try {
      const orderResult = await checkout(orderPayload);
      
      // Save address to backend for logged in users without ever adding a 4th saved address.
      try {
        const authUser = getAuthUser();
        const existingAddresses = normalizeSavedAddresses(authUser?.addresses || checkoutUser?.addresses || []);
        const exists = existingAddresses.some(a => isSameAddress(a, orderPayload.shippingAddress));
        if (exists || existingAddresses.length < MAX_SAVED_ADDRESSES) {
          await saveAddressToBackend(orderPayload.shippingAddress);
          if (authUser && !exists) {
            authUser.addresses = [...existingAddresses, orderPayload.shippingAddress];
            setAuthUser(authUser);
          }
        }
      } catch (addrErr) {
        console.error('Failed to save address to backend profile:', addrErr);
      }

      // Save profile info for future use (guest fallback)
      saveProfile({ phone: phone, firstName: fName, lastName: lName, userId: orderResult?.userId || orderResult?.id || null });
      clearCart();

      const loaderHtml = `
        <div id="checkout-ka-loader-overlay" style="position: fixed; inset: 0; background: #f5f5f5; z-index: 999999; display: flex; align-items: center; justify-content: center;">
          <div class="ka-loader" style="min-height: 100vh; margin: 0;">
            <div class="ka-loader__badge">
              <div class="ka-loader__wordmark">KICKS<br>AURA</div>
            </div>
            <span class="ka-loader__text">Placing Order...</span>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', loaderHtml);

      setTimeout(() => {
        const loaderOverlay = document.getElementById('checkout-ka-loader-overlay');
        if (loaderOverlay) loaderOverlay.remove();
        showOrderConfirmation();
      }, 3000);
    } catch (err) {
      console.error('Order failed:', err);
      if (placeOrderBtn.querySelector('.btn-main-text')) {
        placeOrderBtn.querySelector('.btn-main-text').textContent = 'Complete order';
      }
      placeOrderBtn.style.opacity = '1';
      placeOrderBtn.disabled = false;
      alert(`Order failed: ${err.message || 'Please try again.'}`);
    }
  });
}

// ─── Policy Popups ────────────────────────────────────────────────────────────
const policyData = {
  refund: {
    title: 'Refund Policy',
    html: `
      <ul>
        <li>Refunds are processed within 3 working days after the returned product is received and approved</li>
        <li>Refunds are credited to the original payment method</li>
        <li>For prepaid orders, a full refund will be issued if the order is lost or remains undelivered for 15 working days</li>
      </ul>`
  },
  shipping: {
    title: 'Shipping Policy',
    html: shippingPolicyContent
  },
  return: {
    title: 'Return & Exchange Policy',
    html: `
      <ul>
        <li>If you are not satisfied with the quality, contact the seller on WhatsApp (+91 6239379751) and ship it on your own expense within 5–7 days of delivery</li>
        <li>Refund will be processed within 3 working days after the returned product is received and approved</li>
        <li>We reserve the right to reject returns if the product is used, damaged, or any original item is missing</li>
        <li>Full refund for prepaid orders if the product is lost or remains undelivered for 15 working days</li>
        <li>An unboxing video may be required for return/exchange claims. Claims may be rejected if the issue cannot be verified</li>
      </ul>`
  }
};

const policyOverlay = document.getElementById('policy-modal-overlay');
const policyTitleEl = document.getElementById('policy-modal-title');
const policyBodyEl = document.getElementById('policy-modal-body');
const policyCloseBtn = document.getElementById('policy-modal-close');
const policyFooterCloseBtn = document.getElementById('policy-modal-close-btn');

function openPolicyModal(key) {
  const policy = policyData[key];
  if (!policy || !policyOverlay) return;
  policyTitleEl.textContent = policy.title;
  policyBodyEl.innerHTML = policy.html;
  policyOverlay.classList.add('visible');
}

function closePolicyModal() {
  if (policyOverlay) policyOverlay.classList.remove('visible');
}

document.querySelectorAll('[data-policy]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    openPolicyModal(el.dataset.policy);
  });
});

if (policyCloseBtn) policyCloseBtn.addEventListener('click', closePolicyModal);
if (policyFooterCloseBtn) policyFooterCloseBtn.addEventListener('click', closePolicyModal);
if (policyOverlay) {
  policyOverlay.addEventListener('click', (e) => {
    if (e.target === policyOverlay) closePolicyModal();
  });
}

// ─── Initialize Checkout Display ──────────────────────────────────────────────
document.querySelector('.co-wrap')?.classList.add('auth-ready');

if (!isLoggedIn()) {
  const ref = document.referrer || '';
  const isInternalRef = ref.includes(window.location.host);
  const isInternalSession = sessionStorage.getItem('checkout_intent') === 'true';
  const isInternal = isInternalRef || isInternalSession;
  sessionStorage.removeItem('checkout_intent');
  
  if (isInternal) {
    setTimeout(() => {
      openLoginModal({ context: 'checkout' });
    }, 100);
  } else {
    window.location.href = '/?login=1';
  }
} else {
  // Trigger auth-changed logic to hide contact form and make phone immutable
  setTimeout(() => {
    const user = getAuthUser();
    if (user) {
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { loggedIn: true, user } }));
    }
  }, 10);
}
