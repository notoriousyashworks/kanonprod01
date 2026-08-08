/* ============================================
   Profile Page Logic
   ============================================ */
import { getNavbarHTML, showToast, initSearch, initMobileMenu } from './ui.js';
import { updateCartBadge } from './cart.js';
import { getProfile, saveProfile, initProfileDropdown } from './profile.js?v=1.3';

import { initWishlistSidebar, updateWishlistBadge } from './wishlist.js';
import { initCartSidebar } from './cart-sidebar.js';
import { initLoginModalTrigger } from './login-modal.js';
import { getAuthUser } from './auth.js';


let editingAddressIndex = -1;

function normalizeLocation(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(nct|national capital territory|district|division)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDelhiLocation(city, state) {
  return isDelhiValue(state) || isDelhiValue(city);
}

function isDelhiValue(value) {
  const normalized = normalizeLocation(value);
  return normalized === 'delhi' || normalized === 'new delhi' || normalized.includes(' delhi');
}

function locationMatches(inputCity, inputState, pinCity, pinState) {
  const city = normalizeLocation(inputCity);
  const state = normalizeLocation(inputState);
  const verifiedCity = normalizeLocation(pinCity);
  const verifiedState = normalizeLocation(pinState);
  if (isDelhiLocation(city, state) && isDelhiLocation(verifiedCity, verifiedState)) return true;
  const stateMatches = state === verifiedState || (isDelhiValue(state) && isDelhiValue(verifiedState));
  const cityMatches = city === verifiedCity || city.includes(verifiedCity) || verifiedCity.includes(city);
  return stateMatches && cityMatches;
}

function getCurrentAddresses() {
  const authP = getAuthUser() || {};
  const guestP = getProfile() || {};
  const addresses = authP.addresses?.length ? authP.addresses : guestP.addresses || [];
  return Array.isArray(addresses) ? addresses : [];
}

function fillAddressForm(addr = {}) {
  const firstNameInput = document.getElementById('pf-address-first-name');
  const lastNameInput = document.getElementById('pf-address-last-name');
  const addressInput = document.getElementById('pf-address');
  const landmarkInput = document.getElementById('pf-landmark');
  const cityInput = document.getElementById('pf-city');
  const stateInput = document.getElementById('pf-state');
  const pinInput = document.getElementById('pf-pin');

  if (firstNameInput) firstNameInput.value = addr.firstName || '';
  if (lastNameInput) lastNameInput.value = addr.lastName || '';
  if (addressInput) addressInput.value = addr.houseNumberOrAddress || addr.address || '';
  if (landmarkInput) landmarkInput.value = addr.landmark || '';
  if (cityInput) cityInput.value = addr.city || '';
  if (stateInput) stateInput.value = addr.state || '';
  if (pinInput) pinInput.value = addr.pinCode || '';
}

function openAddressEditor(index = -1) {
  const addresses = getCurrentAddresses();
  editingAddressIndex = index;
  fillAddressForm(index >= 0 ? addresses[index] : {});
  addressEditForm?.classList.add('visible');
  if (saveAddressBtn) saveAddressBtn.textContent = index >= 0 ? 'Update address' : 'Save address';
}

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

window.addEventListener('auth-changed', () => {
  renderProfile();
});

// ─── Load profile data into view ──────────────────────────────────────────────
function renderProfile() {
  const authP = getAuthUser() || {};
  const guestP = getProfile() || {};
  
  // Merge profiles, preferring authenticated data but falling back to guest if missing
  const p = { 
    ...guestP,
    ...authP,
    firstName: guestP.firstName !== undefined ? guestP.firstName : authP.firstName || '',
    lastName: guestP.lastName !== undefined ? guestP.lastName : authP.lastName || '',
    phone: authP.phoneNumber || guestP.phone || '',
    addresses: authP.addresses?.length ? authP.addresses : guestP.addresses || []
  };

  const avatarEl   = document.getElementById('profile-avatar-initials');
  const fullNameEl = document.getElementById('profile-full-name');
  const phoneDispEl = document.getElementById('profile-phone-display');
  const viewPhoneEl = document.getElementById('view-phone');
  const viewNameEl  = document.getElementById('view-name');

  if (p) {
    const rawFullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Guest';
    const formatName = (name) => {
      if (!name) return '';
      return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };
    const fullName = formatName(rawFullName);
    
    const initials = fullName === 'Guest'
      ? '👤'
      : (p.firstName?.[0] || '') + (p.lastName?.[0] || p.firstName?.[1] || '');

    if (avatarEl)   avatarEl.textContent = initials || '👤';
    if (fullNameEl) fullNameEl.textContent = fullName;
    if (phoneDispEl) phoneDispEl.textContent = p.phone ? `+91 ${p.phone}` : 'No phone number saved';
    if (viewPhoneEl) viewPhoneEl.textContent = p.phone ? `+91 ${p.phone}` : '—';
    if (viewNameEl)  viewNameEl.textContent = fullName === 'Guest' ? '—' : fullName;

    // Populate edit form
    const pfFirst = document.getElementById('pf-first-name');
    const pfLast  = document.getElementById('pf-last-name');
    const pfPhone = document.getElementById('pf-phone');
    if (pfFirst) pfFirst.value = p.firstName || '';
    if (pfLast)  pfLast.value  = p.lastName || '';
    if (pfPhone) pfPhone.value = p.phone || '';

    // Address
    renderAddress(p);
  }
}

function renderAddress(p) {
  const addrEmpty   = document.getElementById('address-empty');
  const addrList = document.getElementById('address-list-view');
  
  // Clear any existing address items except the empty state
  const existingItems = addrList.querySelectorAll('.address-item');
  existingItems.forEach(item => item.remove());

  const addresses = (p && Array.isArray(p.addresses)) ? p.addresses : [];
  const addAddressControl = document.getElementById('add-address-btn');
  if (addAddressControl) {
    addAddressControl.disabled = false;
    addAddressControl.textContent = '+ Add New';
    addAddressControl.title = '';
  }

  if (addresses.length > 0) {
    if (addrEmpty) addrEmpty.style.display = 'none';
    
    addresses.forEach((addr, idx) => {
      const addrEl = document.createElement('div');
      addrEl.className = 'address-item';
      addrEl.dataset.index = String(idx);
      addrEl.style.padding = '14px 20px';
      addrEl.style.borderTop = '1px solid #f5f5f5';
      addrEl.style.cursor = 'pointer';
      addrEl.tabIndex = 0;
      addrEl.setAttribute('role', 'button');
      addrEl.setAttribute('aria-label', 'Edit saved address');
      const displayAddress = addr.houseNumberOrAddress || addr.address || '';
      const hasAddressName = addr.firstName !== undefined || addr.lastName !== undefined;
      const recipientName = [
        hasAddressName ? addr.firstName : p.firstName,
        hasAddressName ? addr.lastName : p.lastName
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      const isDefault = idx === 0;
      
      addrEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700; font-size:14px; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
              ${recipientName || 'Recipient'}
              ${isDefault ? '<span style="background:#f1f9cc; color:#2d6a4f; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700;">Default</span>' : ''}
            </div>
            <div style="font-weight:600; font-size:14px; margin-bottom:4px;">
              ${displayAddress}
            </div>
            <div style="color:#666; font-size:13px;">${[addr.city, addr.state, addr.pinCode].filter(Boolean).join(', ')}</div>
          </div>
          <div style="display:flex; gap:16px; align-items:center;">
            ${!isDefault ? `<button class="profile-edit-btn btn-make-default" data-index="${idx}" style="color: #2563eb;">Make Default</button>` : ''}
            <button class="profile-edit-btn btn-delete-addr" data-index="${idx}" style="color: #dc2626;">Delete</button>
          </div>
        </div>
      `;
      addrList.appendChild(addrEl);
    });

    addrList.querySelectorAll('.address-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        openAddressEditor(parseInt(item.dataset.index || '0', 10));
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAddressEditor(parseInt(item.dataset.index || '0', 10));
        }
      });
    });

    // Attach make default listeners
    addrList.querySelectorAll('.btn-make-default').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const updated = [...addresses];
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved); // Move to the top (idx 0)
        saveProfile({ addresses: updated });
        renderProfile();
        showToast('Default address updated', 'success');
      });
    });

    // Attach delete listeners
    addrList.querySelectorAll('.btn-delete-addr').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (confirm('Are you sure you want to delete this address?')) {
          const updated = [...addresses];
          updated.splice(idx, 1);
          saveProfile({ addresses: updated });
          renderProfile();
          showToast('Address removed', 'info');
        }
      });
    });

  } else {
    if (addrEmpty) addrEmpty.style.display = 'flex';
  }
}

renderProfile();

// ─── Edit Contact ──────────────────────────────────────────────────────────────
const editContactBtn   = document.getElementById('edit-contact-btn');
const contactEditForm  = document.getElementById('contact-edit-form');
const contactView      = document.getElementById('contact-view');
const saveContactBtn   = document.getElementById('save-contact-btn');

if (editContactBtn) {
  editContactBtn.addEventListener('click', () => {
    const open = contactEditForm.classList.toggle('visible');
    editContactBtn.textContent = open ? 'Cancel' : 'Edit';
    if (open) contactView.style.display = 'none';
    else contactView.style.display = 'block';
  });
}

if (saveContactBtn) {
  saveContactBtn.addEventListener('click', () => {
    const firstName = document.getElementById('pf-first-name')?.value.trim() || '';
    const lastName  = document.getElementById('pf-last-name')?.value.trim() || '';
    const phone     = document.getElementById('pf-phone')?.value.replace(/\D/g, '').slice(0, 10) || '';
    saveProfile({ firstName, lastName, phone });
    renderProfile();
    initProfileDropdown();
    contactEditForm.classList.remove('visible');
    contactView.style.display = 'block';
    editContactBtn.textContent = 'Edit';
  });
}

// ─── Edit Address ──────────────────────────────────────────────────────────────
const addAddressBtn  = document.getElementById('add-address-btn');
const addressEditForm = document.getElementById('address-edit-form');
const saveAddressBtn  = document.getElementById('save-address-btn');
const cancelAddressBtn = document.getElementById('cancel-address-btn');

if (addAddressBtn) {
  addAddressBtn.addEventListener('click', () => {
    openAddressEditor(-1);
  });
}

if (cancelAddressBtn) {
  cancelAddressBtn.addEventListener('click', () => {
    editingAddressIndex = -1;
    addressEditForm.classList.remove('visible');
    if (saveAddressBtn) saveAddressBtn.textContent = 'Save address';
  });
}

if (saveAddressBtn) {
  saveAddressBtn.addEventListener('click', async () => {
    const firstName = document.getElementById('pf-address-first-name')?.value.trim() || '';
    const lastName  = document.getElementById('pf-address-last-name')?.value.trim() || '';
    const address  = document.getElementById('pf-address')?.value.trim() || '';
    const landmark = document.getElementById('pf-landmark')?.value.trim() || '';
    const city     = document.getElementById('pf-city')?.value.trim() || '';
    const state    = document.getElementById('pf-state')?.value.trim() || '';
    const pinCode  = document.getElementById('pf-pin')?.value.replace(/\D/g, '').slice(0, 6) || '';
    
    if (!firstName || !address || !city || !state || !pinCode) {
      alert('Please fill out all required fields.');
      return;
    }

    const addresses = getCurrentAddresses();

    const wasEditing = editingAddressIndex >= 0;
    const nextAddress = {
      firstName,
      lastName,
      houseNumberOrAddress: address,
      landmark,
      city,
      state,
      pinCode
    };
    if (editingAddressIndex >= 0) {
      addresses[editingAddressIndex] = nextAddress;
    } else {
      addresses.push(nextAddress);
    }
    saveProfile({ addresses });
    renderProfile();
    editingAddressIndex = -1;
    addressEditForm.classList.remove('visible');
    if (saveAddressBtn) saveAddressBtn.textContent = 'Save address';
    showToast(wasEditing ? 'Address updated successfully' : 'Address saved successfully', 'success');
  });
}

// ─── PIN Code Auto-fill ────────────────────────────────────────────────────────
const pfPinInput = document.getElementById('pf-pin');
const pfCityInput = document.getElementById('pf-city');
const pfStateInput = document.getElementById('pf-state');
const pfPinSpinner = document.getElementById('pf-pin-spinner');

let pfPinDebounceTimer = null;
let pfLastLookedUpPin = '';

if (pfPinInput) {
  pfPinInput.addEventListener('input', (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (e.target.value !== cleaned) e.target.value = cleaned;
  });
}

// ─── Sign Out ──────────────────────────────────────────────────────────────────
const signoutBtn = document.getElementById('signout-btn');
const logoutModal = document.getElementById('logout-modal');
const logoutCancel = document.getElementById('logout-cancel');
const logoutConfirm = document.getElementById('logout-confirm');

if (signoutBtn && logoutModal && logoutCancel && logoutConfirm) {
  // Show modal
  signoutBtn.addEventListener('click', () => {
    logoutModal.classList.add('active');
  });

  // Hide modal on cancel
  logoutCancel.addEventListener('click', () => {
    logoutModal.classList.remove('active');
  });

  // Handle actual logout
  logoutConfirm.addEventListener('click', () => {
    logoutModal.classList.remove('active');
    
    localStorage.removeItem('kicksaura_profile');
    localStorage.removeItem('kicksaura_orders');
    
    // If user is authenticated, call the full backend logout
    if (getAuthUser()) {
      import('./auth.js').then(module => {
        module.logout();
      });
    } else {
      window.location.href = '/';
    }
  });

  // Close modal when clicking outside
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.classList.remove('active');
    }
  });
}
