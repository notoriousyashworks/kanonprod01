/* ============================================
   PIN Code Lookup Module (Indian PIN Codes)
   ============================================ */

const pinCache = new Map();
const LOCAL_PIN_PREFIX = 'kicksaura_pin_cache_v2_';

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

  // 1. Check in-memory cache
  if (pinCache.has(pin)) {
    return pinCache.get(pin);
  }

  // 2. Check localStorage cache for instantaneous 0ms response across page reloads
  try {
    const cachedRaw = localStorage.getItem(LOCAL_PIN_PREFIX + pin);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (parsed && typeof parsed.success === 'boolean') {
        pinCache.set(pin, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // 3. Race postalpincode.in via backend proxy and zippopotam.us concurrently for fastest speed
  const fetchPostal = async () => {
    // Using backend proxy to bypass browser CORS / Adblockers
    const res = await fetch(`/api/v1/orders/public/pincode/${encodeURIComponent(pin)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) throw new Error('Invalid response');
    const resultObj = data[0];
    if (resultObj.Status === 'Success' && Array.isArray(resultObj.PostOffice) && resultObj.PostOffice.length > 0) {
      const firstPo = resultObj.PostOffice[0];
      const city = firstPo.District || firstPo.Block || firstPo.Division || '';
      const state = firstPo.State || '';
      return { success: true, city, state, postOffices: resultObj.PostOffice };
    } else {
      const msg = resultObj.Message && resultObj.Message !== 'No records found' ? resultObj.Message : 'Invalid PIN code. No records found.';
      const errRes = { success: false, error: msg };
      throw errRes; // Throw to let Promise validation handle error or alternate API
    }
  };

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
    // Try fetchPostal primarily for better data quality (District instead of specific locality)
    try {
      const result = await fetchPostal();
      pinCache.set(pin, result);
      try { localStorage.setItem(LOCAL_PIN_PREFIX + pin, JSON.stringify(result)); } catch (e) {}
      return result;
    } catch (postalError) {
      // Fallback to fetchZippo if postalpincode.in fails
      const result = await fetchZippo();
      pinCache.set(pin, result);
      try { localStorage.setItem(LOCAL_PIN_PREFIX + pin, JSON.stringify(result)); } catch (e) {}
      return result;
    }
  } catch (aggregateError) {
    // If both failed/rejected, return the error
    const errorResult = {
      success: false,
      error: 'Invalid PIN code. No records found or service unavailable.'
    };
    pinCache.set(pin, errorResult);
    return errorResult;
  }
}
