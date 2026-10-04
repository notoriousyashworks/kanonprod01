/**
 * shuffle.js — Deterministic time-seeded shuffle utility
 *
 * Returns a shuffled copy of the array whose order is consistent across
 * all users within the same 12-hour window and changes automatically
 * every 12 hours.
 *
 * Algorithm: Seeded Mulberry32 PRNG + Fisher-Yates shuffle
 */

/**
 * Get the current 12-hour window seed.
 * Changes every 12 hours (e.g. 00:00–11:59, 12:00–23:59, etc.)
 */
function getTwelveHourSeed() {
  const now = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  return Math.floor(now / twelveHoursMs);
}

/**
 * Mulberry32 — fast, good-quality 32-bit PRNG
 * @param {number} seed
 * @returns {() => number} returns a function that produces floats in [0, 1)
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffle an array using the current 12-hour window seed.
 * All users see the same order; it rotates every 12 hours.
 *
 * @param {Array} arr - The array to shuffle (not mutated)
 * @param {number} [extraSeed=0] - Optional extra seed to differentiate sections (e.g. homepage vs products page)
 * @returns {Array} A new shuffled array
 */
export function timeSeededShuffle(arr, extraSeed = 0) {
  if (!arr || arr.length <= 1) return arr;

  const seed = getTwelveHourSeed() + extraSeed;
  const rng = mulberry32(seed);
  const shuffled = [...arr];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
