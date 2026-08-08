/* ============================================
   PIN Code Lookup Module (Indian PIN Codes)
   ============================================ */

const pinCache = new Map();
const LOCAL_PIN_PREFIX = 'kicksaura_pin_cache_v2_';

const DELHI_PIN_FALLBACKS = {
  '110030': { city: 'Mehrauli', state: 'Delhi' },
  '110074': { city: 'New Delhi', state: 'Delhi' }
};

function getPinFallback(pin) {
  if (DELHI_PIN_FALLBACKS[pin]) {
    return {
      success: true,
      ...DELHI_PIN_FALLBACKS[pin],
      postOffices: [],
      fallback: true
    };
  }

  if (pin.startsWith('110')) {
    return {
      success: true,
      city: 'New Delhi',
      state: 'Delhi',
      postOffices: [],
      fallback: true
    };
  }

  return null;
}

/**
 * Fetches City (District) and State details for a valid 6-digit Indian PIN code.
 * Races multiple public APIs and checks localStorage + memory cache for ultra-fast response.
 *
 * @param {string} pin - The 6-digit PIN code string.
 * @returns {Promise<{success: boolean, city?: string, state?: string, postOffices?: Array, error?: string}>}
 */
export async function lookupPinCode(pin) {
  if (!pin || !/^\d{6}$/.test(pin)) {
    return {
      success: false,
      error: 'PIN code must be exactly 6 digits.'
    };
  }

  const fallback = getPinFallback(pin);

  // 1. Check in-memory cache
  if (pinCache.has(pin)) {
    const cached = pinCache.get(pin);
    return cached?.success || !fallback ? cached : fallback;
  }

  // 2. Check localStorage cache for instantaneous 0ms response across page reloads
  try {
    const cachedRaw = localStorage.getItem(LOCAL_PIN_PREFIX + pin);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (parsed && typeof parsed.success === 'boolean') {
        const resolved = parsed.success || !fallback ? parsed : fallback;
        pinCache.set(pin, resolved);
        return resolved;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  const fetchZippo = async () => {
    const res = await fetch(`https://api.zippopotam.us/IN/${encodeURIComponent(pin)}`);
    if (!res.ok) throw { success: false, error: 'Invalid PIN code. No records found.' };
    const data = await res.json();
    if (data && Array.isArray(data.places) && data.places.length > 0) {
      const place = data.places[0];
      const city = place['place name'] || place.state || '';
      const state = place.state || '';
      return { success: true, city, state, postOffices: data.places };
    }
    throw { success: false, error: 'Invalid PIN code. No records found.' };
  };

  try {
    const result = await fetchZippo();
    pinCache.set(pin, result);
    try { localStorage.setItem(LOCAL_PIN_PREFIX + pin, JSON.stringify(result)); } catch (e) {}
    return result;
  } catch (aggregateError) {
    if (fallback) {
      pinCache.set(pin, fallback);
      try { localStorage.setItem(LOCAL_PIN_PREFIX + pin, JSON.stringify(fallback)); } catch (e) {}
      return fallback;
    }

    // If both failed/rejected, return the error
    const errorResult = {
      success: false,
      error: 'Invalid PIN code. No records found or service unavailable.'
    };
    pinCache.set(pin, errorResult);
    return errorResult;
  }
}
