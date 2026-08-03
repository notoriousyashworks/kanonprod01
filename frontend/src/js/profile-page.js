/* ============================================
   Profile Page Logic
   ============================================ */
import { getNavbarHTML, showToast, initSearch } from './ui.js';
import { updateCartBadge } from './cart.js';
import { getProfile, saveProfile, initProfileDropdown } from './profile.js';
import { lookupPinCode } from './pin-lookup.js';
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
    firstName: authP.firstName || guestP.firstName || '',
    lastName: authP.lastName || guestP.lastName || '',
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

  if (addresses.length > 0) {
    if (addrEmpty) addrEmpty.style.display = 'none';
    
    addresses.forEach((addr, idx) => {
      const addrEl = document.createElement('div');
      addrEl.className = 'address-item';
      addrEl.style.padding = '14px 20px';
      addrEl.style.borderTop = '1px solid #f5f5f5';
      const displayAddress = addr.houseNumberOrAddress || addr.address || '';
      const isDefault = idx === 0;
      
      addrEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:600; font-size:14px; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
              ${displayAddress}
              ${isDefault ? '<span style="background:#f1f9cc; color:#2d6a4f; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700;">Default</span>' : ''}
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
    const p = getProfile();
    const addresses = (p && Array.isArray(p.addresses)) ? p.addresses : [];
    if (addresses.length >= 3) {
      alert('You can save a maximum of 3 addresses. Please delete one to add a new address.');
      return;
    }
    addressEditForm.classList.add('visible');
    // Clear fields
    document.getElementById('pf-address').value = '';
    document.getElementById('pf-landmark').value = '';
    document.getElementById('pf-city').value = '';
    document.getElementById('pf-state').value = '';
    document.getElementById('pf-pin').value = '';
  });
}

if (cancelAddressBtn) {
  cancelAddressBtn.addEventListener('click', () => {
    addressEditForm.classList.remove('visible');
  });
}

if (saveAddressBtn) {
  saveAddressBtn.addEventListener('click', () => {
    const address  = document.getElementById('pf-address')?.value.trim() || '';
    const landmark = document.getElementById('pf-landmark')?.value.trim() || '';
    const city     = document.getElementById('pf-city')?.value.trim() || '';
    const state    = document.getElementById('pf-state')?.value.trim() || '';
    const pinCode  = document.getElementById('pf-pin')?.value.replace(/\D/g, '').slice(0, 6) || '';
    
    if (!address || !city || !state || !pinCode) {
      alert('Please fill out all required fields.');
      return;
    }

    const p = getProfile();
    const addresses = (p && Array.isArray(p.addresses)) ? p.addresses : [];
    if (addresses.length >= 3) {
      alert('You can save a maximum of 3 addresses. Please delete one to add a new address.');
      return;
    }

    addresses.push({ houseNumberOrAddress: address, landmark, city, state, pinCode });
    saveProfile({ addresses });
    renderProfile();
    addressEditForm.classList.remove('visible');
    showToast('Address saved successfully', 'success');
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
    
    if (pfPinDebounceTimer) clearTimeout(pfPinDebounceTimer);
    
    if (cleaned.length !== 6) {
      if (pfPinSpinner) pfPinSpinner.classList.remove('active');
      
      if (pfLastLookedUpPin && cleaned !== pfLastLookedUpPin) {
        if (pfCityInput && pfCityInput.dataset.autofilled === 'true') {
          pfCityInput.value = '';
          delete pfCityInput.dataset.autofilled;
        }
        if (pfStateInput && pfStateInput.dataset.autofilled === 'true') {
          pfStateInput.value = '';
          delete pfStateInput.dataset.autofilled;
        }
        pfLastLookedUpPin = '';
      }
      return;
    }
    
    if (cleaned === pfLastLookedUpPin) return;
    
    pfPinDebounceTimer = setTimeout(async () => {
      if (pfPinSpinner) pfPinSpinner.classList.add('active');
      
      const res = await lookupPinCode(cleaned);
      if (pfPinSpinner) pfPinSpinner.classList.remove('active');
      
      if (pfPinInput.value !== cleaned) return;
      
      if (res.success) {
        pfLastLookedUpPin = cleaned;
        if (pfCityInput && !pfCityInput.value.trim()) {
          pfCityInput.value = res.city || '';
          pfCityInput.dataset.autofilled = 'true';
        }
        if (pfStateInput && !pfStateInput.value.trim()) {
          pfStateInput.value = res.state || '';
          pfStateInput.dataset.autofilled = 'true';
        }
      }
    }, 400);
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
