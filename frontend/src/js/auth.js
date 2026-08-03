/* ============================================
   KicksAura Auth Module
   Manages application JWT and authenticated user state via localStorage.
   ============================================ */

const AUTH_USER_KEY  = 'kicksaura_auth_user';

// ─── User Info ─────────────────────────────────────────────────────────────────

/** @returns {{ uuid, firstName, lastName, phoneNumber, role, addresses } | null} */
export function getAuthUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function setAuthUser(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

// ─── Auth State ────────────────────────────────────────────────────────────────

export function isLoggedIn() {
  // Rely on existence of user info in UI. The actual secure HttpOnly cookie 
  // validates requests to the backend.
  return !!getAuthUser();
}

// ─── Login ─────────────────────────────────────────────────────────────────────

/**
 * Sends the MSG91 access token to our backend, which verifies it server-side,
 * and sets an HttpOnly cookie with the application JWT.
 * @param {string} msg91AccessToken
 * @returns {Promise<{uuid, firstName, lastName, phoneNumber, role}>}
 */
export async function loginWithBackend(msg91AccessToken) {
  const res = await fetch('/api/v1/users/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: msg91AccessToken }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed. Please try again.');
  }

  const data = await res.json();
  // Backend sets the kicksaura_auth_token HttpOnly cookie automatically via Set-Cookie header.
  
  setAuthUser({
    uuid:        data.uuid,
    firstName:   data.firstName,
    lastName:    data.lastName,
    phoneNumber: data.phoneNumber,
    role:        data.role,
    addresses:   data.addresses || [],
  });
  return data;
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  // Call backend to clear the HttpOnly cookie
  try {
    await fetch('/api/v1/users/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.error("Logout request failed", e);
  }

  clearAuthUser();
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { loggedIn: false } }));
  // Always redirect to home on logout
  window.location.href = '/';
}
