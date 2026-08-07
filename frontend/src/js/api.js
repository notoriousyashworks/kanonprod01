/* ============================================
   KicksAura API Client
   ============================================ */

import { logout } from './auth.js';

const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Automatically send HttpOnly cookies
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Session expired or unauthorized. Logging out...");
        logout();
        throw new Error("Session expired. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// === Categories ===
export async function getCategories() {
  return request('/categories');
}

// === Products ===
export async function getAllProducts() {
  const data = await request('/products');
  return data.content || data;
}

export async function getNewArrivals() {
  const data = await request('/products/new-arrivals');
  return data.content || data;
}

export async function getTrendingProducts() {
  const data = await request('/products/trending');
  return data.content || data;
}

export async function filterProducts(filters, page = 0, size = 16) {
  const queryParams = new URLSearchParams();
  if (filters.query) {
    queryParams.append('query', filters.query);
  }
  if (filters.categories && filters.categories.length > 0) {
    queryParams.append('categories', filters.categories.join(','));
  }
  if (filters.brands && filters.brands.length > 0) {
    queryParams.append('brands', filters.brands.join(','));
  }
  // Only send price params when they deviate from the full range
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    queryParams.append('minPrice', filters.minPrice);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice < 35000) {
    queryParams.append('maxPrice', filters.maxPrice);
  }
  if (filters.sizes && filters.sizes.length > 0) {
    queryParams.append('sizes', filters.sizes.join(','));
  }

  queryParams.append('page', page);
  queryParams.append('size', size);

  const queryString = queryParams.toString();
  const endpoint = `/products/filter?${queryString}`;
  return request(endpoint);
}

export async function getProductById(id) {
  return request(`/products/${id}`);
}

export async function searchProducts(query) {
  const data = await request(`/products/search?query=${encodeURIComponent(query)}`);
  return data.content || data;
}

export async function getProductsByCategory(category) {
  const data = await request(`/products/category/${encodeURIComponent(category)}`);
  return data.content || data;
}

// === Brands ===
export async function getBrands() {
  return request('/brands');
}

export async function getSizeChart(brandName) {
  return request(`/brands/${encodeURIComponent(brandName)}/size-chart`);
}

// === Orders ===
export async function checkout(checkoutData) {
  return request('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  });
}

export async function getOrder(orderId) {
  return request(`/orders/${orderId}`);
}

export async function getUserOrders(userId) {
  return request(`/orders/user/${userId}?t=${Date.now()}`);
}

// === Reviews ===
export async function getCustomerReviews() {
  return request('/reviews');
}

// === Profile (Addresses & Info) ===
export async function updateProfileInBackend(profileData) {
  return request('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

export async function saveAddressToBackend(addressData) {
  return request('/users/profile/address', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
}
