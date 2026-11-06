/* ============================================
   Escaping helpers — shared by the browser bundle and the Node SSR renderer.
   DOM-free: safe to import in Node.
   ============================================ */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape a value for use as HTML text content or inside a quoted attribute. */
export function escapeHtml(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Alias kept for readability at attribute call-sites. */
export const escapeAttr = escapeHtml;

/**
 * Serialise data for embedding inside <script type="application/json"> (or
 * application/ld+json). Escapes characters that could close the script element
 * or break JS parsers.
 */
export function safeJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
