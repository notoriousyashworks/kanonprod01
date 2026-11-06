/* ============================================
   Media URL helpers (Cloudinary / ImageKit / BunnyCDN)
   Moved verbatim from ui.js so they can be shared with the Node SSR renderer.
   DOM-free: safe to import in Node. ui.js re-exports everything here.
   ============================================ */

export function formatCloudinaryUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/') && !url.includes('/f_auto')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
  }
  return url;
}

export function formatCloudinaryVideoPoster(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/so_0,w_800,q_auto/f_jpg/');
}

export function formatCloudinaryVideoHls(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/sp_auto:maxres_720p/').replace(/\.mp4$/i, '.m3u8');
}

export function formatCloudinaryVideoMp4(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,vc_h264,w_800/');
}

export function formatCloudinaryHoverPreview(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,vc_h264,w_400/');
}

// ── ImageKit Helpers ──────────────────────────────────────────────────────
// These do NOT affect Cloudinary URLs. All formatCloudinary* functions above
// are completely unchanged and continue working for existing products.

/** True if the URL is an ImageKit delivery URL. */
function isImageKitUrl(url) {
  return typeof url === 'string' && url.includes('ik.imagekit.io');
}

/** ImageKit image with auto quality + format (tr=q-auto,f-auto,w-800). */
export function formatImageKitUrl(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=q-auto,f-auto,w-800';
}

/** ImageKit video poster — first frame as JPEG (tr=so-0,f-jpg,w-800,q-auto). */
export function formatImageKitVideoPoster(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=orig';
}

/**
 * ImageKit optimised MP4 delivery (tr=f-mp4,q-auto).
 * Note: HLS/ABR streaming requires the ImageKit Adaptive Bitrate add-on.
 * Plain MP4 is used here so it works on all ImageKit plans.
 */
export function formatImageKitVideoMp4(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=orig';
}

/** ImageKit hover-preview video (low-width for product cards). */
export function formatImageKitHoverPreview(url) {
  if (!isImageKitUrl(url)) return url;
  if (url.includes('tr=') || url.includes('/tr:')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'tr=orig';
}

// ── Provider-agnostic Dispatch Functions ────────────────────────────────
// Use these in new code so Cloudinary and ImageKit URLs both work.

/** Optimise an image URL regardless of CDN provider. */
export function formatMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryUrl(url);
  if (isImageKitUrl(url)) return formatImageKitUrl(url);
  return url;
}

/** Video poster — routes to the correct provider's still-frame function. */
export function formatVideoPoster(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryVideoPoster(url);
  if (isImageKitUrl(url)) return formatImageKitVideoPoster(url);
  // BunnyCDN HLS path: swap playlist.m3u8 for thumbnail.jpg
  if (url.includes('.b-cdn.net') && url.includes('.m3u8')) return url.replace('playlist.m3u8', 'thumbnail.jpg');
  // Plain .mp4 BunnyCDN URL — no thumbnail transform available, return empty so no broken poster
  if (url.includes('.b-cdn.net')) return '';
  return url;
}

/**
 * Video HLS URL — routes to provider.
 * ImageKit: returns raw URL (HLS needs ABR add-on; MP4 is the reliable fallback).
 * BunnyCDN plain .mp4: return null so the player skips HLS and uses mp4 directly.
 */
export function formatVideoHls(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryVideoHls(url);
  if (isImageKitUrl(url)) return url; // raw URL; HLS.js will fail gracefully → MP4 fallback
  if (url.includes('.b-cdn.net') && url.includes('.m3u8')) return url; // Already HLS
  // Plain .mp4 from BunnyCDN — return null so initVideoPlayback skips HLS and plays mp4
  if (url.includes('.b-cdn.net') && url.includes('.mp4')) return null;
  return url;
}

/** Optimised MP4 — routes to the correct provider. */
export function formatVideoMp4(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryVideoMp4(url);
  if (isImageKitUrl(url)) return formatImageKitVideoMp4(url);
  if (url.includes('.b-cdn.net') && url.includes('.m3u8')) return url.replace('playlist.m3u8', 'play_720p.mp4');
  // Plain .mp4 BunnyCDN URL — use as-is
  if (url.includes('.b-cdn.net') && url.includes('.mp4')) return url;
  return url;
}

/** Low-res hover-preview video — routes to the correct provider. */
export function formatVideoHoverPreview(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com')) return formatCloudinaryHoverPreview(url);
  if (isImageKitUrl(url)) return formatImageKitHoverPreview(url);
  if (url.includes('.b-cdn.net') && url.includes('.m3u8')) return url.replace('playlist.m3u8', 'play_480p.mp4');
  return url;
}
