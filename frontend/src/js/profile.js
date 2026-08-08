/* ============================================
   KicksAura Profile & Order History Module
   ============================================ */
import { getUserOrders, updateProfileInBackend } from './api.js';
import { getAuthUser, setAuthUser, isLoggedIn, logout as authLogout } from './auth.js';
import { openLoginModal } from './login-modal.js?v=1.6';

const PROFILE_KEY = 'kicksaura_profile';
const ORDERS_KEY  = 'kicksaura_orders';
function normalizeAddresses(addresses) {
  return Array.isArray(addresses) ? addresses : [];
}

function cleanOptional(value) {
  return value == null ? '' : String(value).trim();
}

// ─── Profile (name + phone) ────────────────────────────────────────────────────

export function getProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function saveProfile(data) {
  const existing = getProfile() || {};
  const normalizedData = {
    ...data,
    ...(data.firstName !== undefined ? { firstName: cleanOptional(data.firstName) } : {}),
    ...(data.lastName !== undefined ? { lastName: cleanOptional(data.lastName) } : {}),
    ...(data.addresses !== undefined ? { addresses: normalizeAddresses(data.addresses) } : {})
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...existing, ...normalizedData }));
  
  const authUser = getAuthUser();
  if (authUser) {
    // Update localStorage immediately for instant UI feedback
    if (normalizedData.firstName !== undefined) authUser.firstName = normalizedData.firstName;
    if (normalizedData.lastName  !== undefined) authUser.lastName  = normalizedData.lastName;
    if (normalizedData.phone     !== undefined) authUser.phoneNumber = normalizedData.phone;
    if (normalizedData.addresses !== undefined) authUser.addresses = normalizedData.addresses;
    setAuthUser(authUser);
    
    // Persist to backend DB — update authUser with confirmed backend values
    if (normalizedData.firstName !== undefined || normalizedData.lastName !== undefined || normalizedData.addresses !== undefined) {
      updateProfileInBackend({
        firstName: normalizedData.firstName !== undefined ? normalizedData.firstName : authUser.firstName,
        lastName:  normalizedData.lastName !== undefined ? normalizedData.lastName : authUser.lastName ?? '',
        addresses: normalizeAddresses(normalizedData.addresses ?? authUser.addresses ?? [])
      }).then(updated => {
        // Sync confirmed values from DB back to localStorage
        if (updated) {
          const current = getAuthUser() || {};
          current.firstName = normalizedData.firstName !== undefined ? normalizedData.firstName : updated.firstName;
          current.lastName  = normalizedData.lastName !== undefined ? normalizedData.lastName : updated.lastName;
          current.addresses = normalizedData.addresses !== undefined
            ? normalizedData.addresses
            : normalizeAddresses(updated.addresses || current.addresses);
          setAuthUser(current);
          window.dispatchEvent(new CustomEvent('auth-changed'));
        }
      }).catch(err => console.error('Failed to sync profile to backend:', err));
    }
  }
}

export function getAddresses() {
  const authUser = getAuthUser();
  if (authUser && Array.isArray(authUser.addresses)) {
    return normalizeAddresses(authUser.addresses);
  }
  const profile = getProfile();
  return normalizeAddresses(profile?.addresses);
}

export function saveAddress(addressObj) {
  const addresses = getAddresses();
  addresses.push(addressObj);
  saveProfile({ addresses });
}

export function removeAddress(index) {
  const addresses = getAddresses();
  if (index >= 0 && index < addresses.length) {
    addresses.splice(index, 1);
    saveProfile({ addresses });
  }
}

// ─── Order History ─────────────────────────────────────────────────────────────

export async function getOrders() {
  const authUser = getAuthUser();
  const profile  = getProfile();
  
  const authUserId = authUser?.uuid;
  const profileUserId = profile?.userId;
  
  const userIdsToFetch = new Set();
  if (authUserId) userIdsToFetch.add(authUserId);
  if (profileUserId) userIdsToFetch.add(profileUserId);
  
  if (userIdsToFetch.size === 0) return [];
  
  try {
    const allOrders = [];
    for (const id of userIdsToFetch) {
      const orders = await getUserOrders(id);
      if (Array.isArray(orders)) {
        allOrders.push(...orders);
      }
    }
    
    // Sort combined orders by createdAt descending
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Deduplicate by order ID just in case
    const uniqueOrders = [];
    const seen = new Set();
    for (const order of allOrders) {
      if (!seen.has(order.id)) {
        seen.add(order.id);
        uniqueOrders.push(order);
      }
    }
    
    return uniqueOrders;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

// ─── Navbar Profile Dropdown ──────────────────────────────────────────────────

let _dropdownInitialized = false;

/**
 * Updates the dropdown UI state based on current auth.
 * Safe to call multiple times — only touches DOM content, not event listeners.
 */
function formatName(name) {
  if (!name) return '';
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function updateDropdownState() {
  const nameEl      = document.getElementById('profile-dropdown-name');
  const authSection = document.getElementById('profile-dropdown-auth');

  if (!authSection) return; // navbar not in DOM yet

  const authUser = getAuthUser();
  const profile  = getProfile();

  // Set display name
  if (nameEl) {
    if (profile?.firstName) {
      nameEl.textContent = formatName([profile.firstName, profile.lastName].filter(Boolean).join(' ').trim());
    } else if (authUser?.firstName || authUser?.phoneNumber) {
      const displayName = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ').trim();
      nameEl.textContent = formatName(displayName) || `+91 ${authUser.phoneNumber}`;
    } else if (profile?.phone) {
      nameEl.textContent = `+91 ${profile.phone}`;
    } else {
      nameEl.textContent = '';
    }
  }

  // Toggle sections
  if (isLoggedIn()) {
    if (nameEl)      nameEl.style.display      = 'block';
    if (authSection) authSection.style.display = 'none';
  } else {
    if (nameEl)      nameEl.style.display      = nameEl?.textContent ? 'block' : 'none';
    if (authSection) authSection.style.display = 'flex';
  }
}

/**
 * Initialises dropdown: sets up event listeners ONCE, then updates UI state.
 */
export function initProfileDropdown() {
  const wrap     = document.getElementById('profile-dropdown-wrap');
  const dropdown = document.getElementById('profile-dropdown');
  if (!wrap || !dropdown) return;

  // Always update the visible state
  updateDropdownState();

  // Wire up event listeners only once
  if (_dropdownInitialized) return;
  _dropdownInitialized = true;

  // Bind the login button and intercept profile/orders links
  wrap.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('#profile-login-btn');
    if (loginBtn) {
      e.preventDefault();
      e.stopPropagation();
      openLoginModal(window.location.pathname);
      dropdown.classList.remove('visible');
    }
    
    // If user is not logged in, intercept clicks on Profile and Orders
    const profileLink = e.target.closest('#profile-dd-profile');
    const ordersLink = e.target.closest('#profile-dd-orders');
    if ((profileLink || ordersLink) && !isLoggedIn()) {
      e.preventDefault();
      e.stopPropagation();
      const redirectUrl = profileLink ? '/profile' : '/orders';
      openLoginModal(redirectUrl);
      dropdown.classList.remove('visible');
    }
    
    const logoutBtn = e.target.closest('#profile-logout-btn');
    if (logoutBtn) {
      authLogout();
    }
  });

  // Hover (desktop)
  let hoverTimeout;
  wrap.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimeout);
    dropdown.classList.add('visible');
  });
  wrap.addEventListener('mouseleave', () => {
    hoverTimeout = setTimeout(() => dropdown.classList.remove('visible'), 200);
  });

  // Click toggle (mobile)
  const iconBtn = document.getElementById('profile-icon-btn');
  if (iconBtn) {
    iconBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('visible');
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) dropdown.classList.remove('visible');
  });
}

// Update dropdown state whenever auth changes (login / logout)
window.addEventListener('auth-changed', () => {
  updateDropdownState();
});

// ─── Logout ────────────────────────────────────────────────────────────────────

export function logout() {
  return authLogout();
}

// Expose to login-modal.js event delegation
window._kicksauraAuth = { logout };
