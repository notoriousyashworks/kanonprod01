/* ============================================
   HTML template injection for the SSR renderer.

   Templates are the Vite-built pages (dist/*.html). Regions the renderer may
   fill are delimited in the source HTML with marker comments, e.g.
     <div id="navbar-container"><!--ssr:navbar--><!--/ssr:navbar--></div>
   so injection never depends on fragile structural regexes. The browser JS
   replaces these containers' innerHTML exactly as before.
   ============================================ */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml, safeJson } from '../src/js/shared/escape.js';

export const DIST_DIR = process.env.SSR_DIST || '/usr/share/nginx/html';

const templateCache = new Map();

/** Load a built template (cached for the life of the process; the image is immutable). */
export function loadTemplate(file, dir = DIST_DIR) {
  const key = join(dir, file);
  if (!templateCache.has(key)) {
    if (!existsSync(key)) return null;
    templateCache.set(key, readFileSync(key, 'utf8'));
  }
  return templateCache.get(key);
}

export function clearTemplateCache() {
  templateCache.clear();
}

/** Replace the content between <!--ssr:name--> and <!--/ssr:name-->. No-op if absent. */
export function fillRegion(html, name, inner) {
  const open = `<!--ssr:${name}-->`;
  const close = `<!--/ssr:${name}-->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close, start + open.length);
  if (start === -1 || end === -1) return html;
  return html.slice(0, start + open.length) + inner + html.slice(end);
}

export function setTitle(html, title) {
  if (!title) return html;
  const tag = `<title>${escapeHtml(title)}</title>`;
  return html.replace(/<title>[\s\S]*?<\/title>/i, () => tag); // function form: no `$&` expansion
}

export function setMetaDescription(html, description) {
  if (!description) return html;
  const tag = `<meta name="description" content="${escapeHtml(description)}" />`;
  const re = /<meta\s+name=["']description["'][^>]*>/i;
  return re.test(html) ? html.replace(re, () => tag) : html.replace(/<\/title>/i, () => `</title>\n  ${tag}`);
}

/** Remove head tags the renderer owns, so they are never duplicated. */
export function stripManagedHead(html, { og = false } = {}) {
  let out = html
    .replace(/[ \t]*<link\s+rel=["']canonical["'][^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\s*\n?/gi, '');
  if (og) out = out.replace(/[ \t]*<meta\s+property=["']og:[^"']+["'][^>]*>\s*\n?/gi, '');
  return out;
}

export function appendToHead(html, tags) {
  if (!tags) return html;
  return html.replace(/<\/head>/i, () => `  ${tags}\n</head>`);
}

/** Embed data for the client (read by product-details.js) before </body>. */
export function embedData(html, data) {
  const script = `<script type="application/json" id="ka-ssr-data">${safeJson(data)}</script>`;
  return html.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => `${script}\n</body>`);
}

export function replaceH1Text(html, id, text) {
  if (!text) return html;
  const re = new RegExp(`(<h1[^>]*id=["']${id}["'][^>]*>)[\\s\\S]*?(</h1>)`, 'i');
  return html.replace(re, (_, open, close) => `${open}${escapeHtml(text)}${close}`);
}
