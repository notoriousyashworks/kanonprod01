/* ============================================
   SSR → API gateway client with an in-memory TTL cache.
   Read-only: only public GET endpoints are called.
   ============================================ */

export const API_BASE = (process.env.SSR_API_BASE || 'http://api-gateway:8080/api/v1').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.SSR_API_TIMEOUT_MS || 2500);

export class NotFoundError extends Error {
  constructor(path) { super(`Not found: ${path}`); this.name = 'NotFoundError'; }
}
export class UpstreamError extends Error {
  constructor(path, cause) { super(`Upstream failure: ${path} (${cause})`); this.name = 'UpstreamError'; }
}

const cache = new Map(); // key → { expires, value } | { expires, promise }
const MAX_ENTRIES = Number(process.env.SSR_CACHE_MAX || 3000);

function remember(key, ttlMs, loader) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.promise;

  const promise = loader().catch((err) => {
    // Don't cache failures (a short negative cache for 404s is handled below).
    if (cache.get(key)?.promise === promise) cache.delete(key);
    throw err;
  });
  if (cache.size >= MAX_ENTRIES) {
    // Drop the oldest entry (Map preserves insertion order).
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { expires: now + ttlMs, promise });
  return promise;
}

export function clearCache() {
  cache.clear();
}

async function getJson(path) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
  } catch (err) {
    throw new UpstreamError(path, err.name === 'AbortError' ? 'timeout' : err.message);
  } finally {
    clearTimeout(timer);
  }
  // product-service maps invalid UUIDs to 409 and hidden/missing products to 404.
  if (res.status === 404 || res.status === 409 || res.status === 400) throw new NotFoundError(path);
  if (!res.ok) throw new UpstreamError(path, `HTTP ${res.status}`);
  try {
    return await res.json();
  } catch (err) {
    throw new UpstreamError(path, 'invalid JSON');
  }
}

const MIN = 60 * 1000;

export function getProduct(id) {
  return remember(`product:${id}`, 5 * MIN, () => getJson(`/products/${encodeURIComponent(id)}`));
}

export function getCategories() {
  return remember('categories', 10 * MIN, async () => {
    const list = await getJson('/categories');
    return (Array.isArray(list) ? list : []).filter(c => c && c.name && c.active !== false);
  });
}

export function getNewArrivals(page = 0, size = 16) {
  return remember(`new-arrivals:${page}:${size}`, 5 * MIN, async () => {
    const data = await getJson(`/products/new-arrivals?page=${page}&size=${size}`);
    return data.content || data || [];
  });
}

/** Mirrors frontend/src/js/api.js filterProducts() so SSR shows the same first batch. */
export function filterProducts({ categories = [] } = {}, page = 0, size = 16) {
  const qs = new URLSearchParams();
  if (categories.length) qs.append('categories', categories.join(','));
  qs.append('page', page);
  qs.append('size', size);
  return remember(`filter:${qs}`, 5 * MIN, () => getJson(`/products/filter?${qs}`));
}

/** Every visible product (paged). Used by the sitemap. */
export function getAllProducts(pageSize = 500) {
  return remember(`all-products:${pageSize}`, 60 * MIN, async () => {
    const all = [];
    for (let page = 0; page < 200; page++) {
      const data = await getJson(`/products?page=${page}&size=${pageSize}`);
      const content = data.content || [];
      all.push(...content);
      if (data.last !== false || content.length === 0) break;
    }
    return all;
  });
}
