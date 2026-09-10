/**
 * ============================================================
 *  Kicks Aura — Media Migration to Bunny.net
 *  migrate_media_to_bunny.js
 * ============================================================
 *
 *  Migrates all product images/videos stored on Cloudinary
 *  or ImageKit to Bunny Storage + Bunny CDN.
 *
 *  Usage:
 *   node migrate_media_to_bunny.js --dry-run
 *   node migrate_media_to_bunny.js
 *   node migrate_media_to_bunny.js --provider cloudinary
 *   node migrate_media_to_bunny.js --provider imagekit
 *   node migrate_media_to_bunny.js --product <uuid>
 *   node migrate_media_to_bunny.js --limit 10
 *   node migrate_media_to_bunny.js --retry-failed
 *   node migrate_media_to_bunny.js --validate
 *
 *  Required env vars (root .env):
 *   BUNNY_STORAGE_ZONE
 *   BUNNY_STORAGE_API_KEY
 *   BUNNY_STORAGE_HOST      (e.g. storage.bunnycdn.com)
 *   BUNNY_CDN_BASE_URL      (e.g. https://kicksaura.b-cdn.net)
 *   PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD
 *   JWT_SECRET
 *   KICKSAURA_API_URL       (optional, defaults to Railway URL)
 *
 *  Optional env vars:
 *   MIGRATION_CONCURRENCY   (default: 1)
 *   MIGRATION_MAX_RETRIES   (default: 3)
 * ============================================================
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs     = require('fs');
const path   = require('path');
const { URL } = require('url');
const crypto = require('crypto');

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN       = args.includes('--dry-run');
const VALIDATE_MODE = args.includes('--validate');
const RETRY_FAILED  = args.includes('--retry-failed');

let FILTER_PROVIDER = null;
let FILTER_PRODUCT  = null;
let LIMIT           = null;

const providerIdx = args.indexOf('--provider');
if (providerIdx !== -1) FILTER_PROVIDER = (args[providerIdx + 1] || '').toLowerCase();

const productIdx = args.indexOf('--product');
if (productIdx !== -1) FILTER_PRODUCT = args[productIdx + 1] || null;

const limitIdx = args.indexOf('--limit');
if (limitIdx !== -1) LIMIT = parseInt(args[limitIdx + 1], 10) || null;

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  bunny: {
    storageZone : process.env.BUNNY_STORAGE_ZONE    || '',
    apiKey      : process.env.BUNNY_STORAGE_API_KEY || '',
    host        : process.env.BUNNY_STORAGE_HOST    || 'storage.bunnycdn.com',
    cdnBaseUrl  : (process.env.BUNNY_CDN_BASE_URL || '').replace(/\/$/, ''),
    folder      : 'products',
  },
  db: {
    // Supports: PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD (standard pg env)
    //   or:    POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB (docker-compose style)
    //   or:    DATABASE_URL (parsed if set)
    host     : process.env.PGHOST        || process.env.POSTGRES_HOST     || 'localhost',
    port     : parseInt(process.env.PGPORT || '5432', 10),
    database : process.env.PGDATABASE    || process.env.POSTGRES_DB       || 'kicksaura',
    user     : process.env.PGUSER        || process.env.POSTGRES_USER     || '',
    password : process.env.PGPASSWORD    || process.env.POSTGRES_PASSWORD || '',
    ssl      : (process.env.PGHOST && process.env.PGHOST !== 'localhost' &&
                process.env.PGHOST !== '127.0.0.1')
                 ? { rejectUnauthorized: false } : false,
    schema   : 'prod',
  },
  api: {
    baseUrl: (process.env.KICKSAURA_API_URL ||
      'https://pure-grace-production-6c99.up.railway.app').replace(/\/$/, ''),
  },
  migration: {
    concurrency    : parseInt(process.env.MIGRATION_CONCURRENCY || '1', 10),
    maxRetries     : parseInt(process.env.MIGRATION_MAX_RETRIES || '3',  10),
    pageSize       : 50,
    requestTimeout : 60000,
    statePath      : path.join(__dirname, 'migration_state.json'),
  },
};

// ─── Env Validation ───────────────────────────────────────────────────────────

function validateEnv() {
  // If PGUSER/POSTGRES_USER and password are set (any combination), DB is OK.
  const dbUser = CONFIG.db.user;
  const dbPass = CONFIG.db.password;
  const required = [
    ['BUNNY_STORAGE_ZONE',    CONFIG.bunny.storageZone],
    ['BUNNY_STORAGE_API_KEY', CONFIG.bunny.apiKey],
    ['BUNNY_STORAGE_HOST',    CONFIG.bunny.host],
    ['BUNNY_CDN_BASE_URL',    CONFIG.bunny.cdnBaseUrl],
    ['PGUSER / POSTGRES_USER',    dbUser],
    ['PGPASSWORD / POSTGRES_PASSWORD', dbPass],
    ['JWT_SECRET',            process.env.JWT_SECRET],
  ];
  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missing.forEach(k => console.error(`   - ${k}`));
    console.error('\nSet them in the root .env file. See .env.example.\n');
    process.exit(1);
  }
}

// ─── JWT Minting ──────────────────────────────────────────────────────────────

function mintAdminJwt() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  const key = Buffer.from(secret, 'base64');
  const b64u = obj => Buffer.from(JSON.stringify(obj))
    .toString('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
  const h = b64u({ alg: 'HS256', typ: 'JWT' });
  const p = b64u({
    sub: 'migration-script', role: 'ROLE_ADMIN',
    iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 3600*24*7,
  });
  const sig = crypto.createHmac('sha256', key).update(`${h}.${p}`)
    .digest('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
  return `${h}.${p}.${sig}`;
}

// ─── Persistent State ─────────────────────────────────────────────────────────
//
//  migration_state.json — per-asset tracking:
//  {
//    "assets": {
//      "<productId>:image:<idx>": {
//        productId, assetType, assetIndex,
//        sourceProvider, sourceUrl,          ← original URL, NEVER overwritten
//        bunnyPath, bunnyUrl,
//        status,  attempts, error, migratedAt
//      }
//    }
//  }

let STATE = { assets: {} };

function loadState() {
  if (fs.existsSync(CONFIG.migration.statePath)) {
    try {
      STATE = JSON.parse(fs.readFileSync(CONFIG.migration.statePath, 'utf-8'));
      if (!STATE.assets) STATE.assets = {};
    } catch {
      console.warn('⚠️  Could not parse migration_state.json — starting fresh.');
      STATE = { assets: {} };
    }
  }
}

// Fix 1: Atomic state writes — write to a temp file then rename so a crash
// mid-write cannot corrupt migration_state.json.
function saveState() {
  const tmp = CONFIG.migration.statePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(STATE, null, 2));
  fs.renameSync(tmp, CONFIG.migration.statePath);
}

function assetKey(productId, type, idx) { return `${productId}:${type}:${idx}`; }
function getAS(key) { return STATE.assets[key] || null; }
function setAS(key, data) {
  STATE.assets[key] = { ...STATE.assets[key], ...data };
  saveState();
}

// ─── Provider Detection ───────────────────────────────────────────────────────

function detectProvider(url) {
  if (!url || typeof url !== 'string') return 'unknown';
  if (url.includes('res.cloudinary.com')) return 'cloudinary';
  if (url.includes('ik.imagekit.io'))     return 'imagekit';
  if (url.includes('b-cdn.net') || url.includes('bunnycdn.com') ||
      (CONFIG.bunny.cdnBaseUrl && url.startsWith(CONFIG.bunny.cdnBaseUrl)))
    return 'bunny';
  return 'unknown';
}

// ─── CloudinaryProvider ───────────────────────────────────────────────────────

// Fix 3: Robust Cloudinary/ImageKit URL stripping.
const CloudinaryProvider = {
  /**
   * Strip ALL transformation segments between /upload/ and the
   * version token (v<digits>) or the first path component of the public_id.
   *
   * Cloudinary URL forms observed in this project:
   *   /upload/f_auto,q_auto,w_800/v1234/folder/file.jpg   — with version
   *   /upload/f_auto,q_auto,w_800/folder/file.jpg         — without version
   *   /upload/sp_auto:maxres_720p/folder/video.m3u8       — video stream
   *   /upload/so_0,w_800,q_auto/f_jpg/folder/img          — chained transforms
   *
   * Strategy: remove every slash-delimited segment after /upload/ that looks
   * like a Cloudinary transformation (contains letters + underscores/colons
   * but is NOT a version token like v1234 and NOT a folder/file name).
   * A transform segment never contains a dot (file extension) and always
   * contains at least one parameter separator (underscore, colon, or comma).
   */
  getOriginalUrl(url) {
    if (!url.includes('/upload/')) return url;
    // Split on /upload/ and rebuild without transform segments.
    const [base, rest] = url.split('/upload/');
    if (!rest) return url;
    const parts = rest.split('/');
    const cleaned = [];
    for (const part of parts) {
      // Version token: keep (e.g. v1234567890)
      if (/^v\d+$/.test(part)) { cleaned.push(part); continue; }
      // Looks like a transform: contains comma or colon, no dot, not a plain folder name
      // Transform segments: f_auto  q_auto,w_800  sp_auto:maxres_720p  so_0  vc_h264
      const isTransform = /[,:]/.test(part) || /^[a-z]{1,3}_[a-zA-Z0-9]+$/.test(part);
      if (isTransform && !part.includes('.')) continue; // skip transform
      cleaned.push(part);
    }
    // If we removed nothing, return original to avoid infinite loop on odd URLs
    if (cleaned.length === parts.length) return url;
    return `${base}/upload/${cleaned.join('/')}`;
  },

  // Detect whether the URL refers to a video resource.
  isVideo(url) {
    return url.includes('/video/') ||
      /\.(mp4|mov|webm|m3u8)(\?|$)/i.test(url);
  },
};

// ─── ImageKitProvider ─────────────────────────────────────────────────────────

const ImageKitProvider = {
  /**
   * Strip ALL ImageKit transformation parameters so we download the original.
   *
   * ImageKit transform forms observed:
   *   ?tr=q-auto,f-auto,w-800       — query param
   *   ?tr=orig                      — query param (already original)
   *   /tr:q-auto,w-800/path/file    — path-based transform
   *   /tr:orig/path/file            — path-based
   */
  getOriginalUrl(url) {
    try {
      const u = new URL(url);
      // Remove ALL tr query params (tr may appear multiple times)
      u.searchParams.delete('tr');
      // Remove ALL path-based transform segments  /tr:.../<rest>
      u.pathname = u.pathname.replace(/\/tr:[^/]*/g, '');
      // Clean up double slashes
      u.pathname = u.pathname.replace(/\/\/+/g, '/');
      return u.toString();
    } catch { return url; }
  },
};

// ─── BunnyProvider ────────────────────────────────────────────────────────────

const BunnyProvider = {
  buildPath(productId, assetType, index, ext) {
    const folder = assetType === 'video' ? 'videos' : 'images';
    const prefix = assetType === 'video' ? 'vid' : 'img';
    const idx    = String(index + 1).padStart(2, '0');
    const e      = (ext || 'jpg').replace(/^\./, '');
    return `${CONFIG.bunny.folder}/${productId}/${folder}/${prefix}-${idx}.${e}`;
  },

  cdnUrl(p) { return `${CONFIG.bunny.cdnBaseUrl}/${p}`; },

  // Fix 2: Streaming upload — body is the fetch Response stream, no Buffer in RAM.
  // Caller passes either a Buffer (images, small files) or a ReadableStream (videos).
  async upload(bodyOrBuffer, bunnyPath, contentType, contentLength) {
    const url = `https://${CONFIG.bunny.host}/${CONFIG.bunny.storageZone}/${bunnyPath}`;
    const headers = {
      'AccessKey'    : CONFIG.bunny.apiKey,
      'Content-Type' : contentType || 'application/octet-stream',
    };
    if (contentLength != null) headers['Content-Length'] = String(contentLength);

    // Node.js fetch requires duplex:'half' whenever the request body is a
    // ReadableStream (i.e. for streaming video uploads). Without this flag
    // Node throws: "RequestInit: duplex option is required when sending a body".
    // Buffers (images) do not need it, but setting it unconditionally is harmless.
    const fetchOpts = { method: 'PUT', headers, body: bodyOrBuffer, duplex: 'half' };

    const res = await fetchTimeout(url, fetchOpts,
      // Videos can be large; extend timeout proportionally
      Math.max(CONFIG.migration.requestTimeout, 300_000));
    if (res.status !== 201 && res.status !== 200) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Bunny upload HTTP ${res.status}: ${txt}`);
    }
    return BunnyProvider.cdnUrl(bunnyPath);
  },

  // Fix 6: Improved duplicate detection — returns size AND etag where available.
  async stat(bunnyPath) {
    const url = `https://${CONFIG.bunny.host}/${CONFIG.bunny.storageZone}/${bunnyPath}`;
    try {
      // Bunny Storage API rejects HEAD requests with 401 Unauthorized.
      // We must use GET with a 1-byte Range to stat the file.
      const res = await fetchTimeout(url, {
        method : 'GET',
        headers: { 'AccessKey': CONFIG.bunny.apiKey, 'Range': 'bytes=0-0' },
      });
      // Drain response body to free the connection
      await res.body?.cancel().catch(() => {});
      
      if (res.status === 200 || res.status === 206) {
        // Extract size from Content-Range (e.g. "bytes 0-0/12345") or Content-Length fallback
        const cr = res.headers.get('content-range') || '';
        const crMatch = cr.match(/\/(\d+)$/);
        const size = crMatch ? parseInt(crMatch[1], 10) : parseInt(res.headers.get('content-length') || '0', 10);
        
        return {
          exists : true,
          size,
          etag   : (res.headers.get('etag') || '').replace(/"/g, ''),
        };
      }
      return { exists: false, size: 0, etag: '' };
    } catch { return { exists: false, size: 0, etag: '' }; }
  },
};

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

async function fetchTimeout(url, options = {}, ms = CONFIG.migration.requestTimeout) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...options, signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
}

// Fix 2: For images (small) — buffer in RAM as before.
async function downloadBuffer(url) {
  const res = await fetchTimeout(url, { headers: { 'User-Agent': 'KicksAura-Migration/1.0' } });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}: ${url}`);
  const ab  = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length < 512) throw new Error(`File too small (${buf.length}B) — likely error page`);
  return { buffer: buf, contentType: res.headers.get('content-type') || '', size: buf.length };
}

// Fix 2: For videos — open a streaming response so the body is piped directly
// to Bunny without buffering the entire file in Node memory.
async function openDownloadStream(url) {
  const res = await fetchTimeout(url, {
    headers: { 'User-Agent': 'KicksAura-Migration/1.0' },
  }, Math.max(CONFIG.migration.requestTimeout, 300_000));
  if (!res.ok) throw new Error(`Download HTTP ${res.status}: ${url}`);
  const ct   = res.headers.get('content-type') || '';
  const size = parseInt(res.headers.get('content-length') || '0', 10) || null;
  return { stream: res.body, contentType: ct, size };
}

function guessContentType(url, ct) {
  if (ct && !ct.includes('text/') && !ct.includes('html')) return ct.split(';')[0].trim();
  const l = url.toLowerCase();
  if (l.endsWith('.mp4'))  return 'video/mp4';
  if (l.endsWith('.mov'))  return 'video/quicktime';
  if (l.endsWith('.webm')) return 'video/webm';
  if (l.endsWith('.jpg') || l.endsWith('.jpeg')) return 'image/jpeg';
  if (l.endsWith('.png'))  return 'image/png';
  if (l.endsWith('.webp')) return 'image/webp';
  if (l.endsWith('.gif'))  return 'image/gif';
  return 'application/octet-stream';
}

function guessExt(url, ct) {
  const m = url.toLowerCase().match(/\.(mp4|mov|webm|jpg|jpeg|png|webp|gif)(\?|$)/);
  if (m) return m[1] === 'jpeg' ? 'jpg' : m[1];
  if (ct) {
    if (ct.includes('video/mp4'))       return 'mp4';
    if (ct.includes('video/quicktime')) return 'mov';
    if (ct.includes('video/webm'))      return 'webm';
    if (ct.includes('image/jpeg'))      return 'jpg';
    if (ct.includes('image/png'))       return 'png';
    if (ct.includes('image/webp'))      return 'webp';
    if (ct.includes('image/gif'))       return 'gif';
  }
  return 'bin';
}

// ─── Retry w/ Exponential Backoff ────────────────────────────────────────────

async function withRetry(fn, attempts, label) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (err) {
      last = err;
      const msg = err.message || '';
      // Don't retry permanent failures
      if (msg.includes('HTTP 404') || msg.includes('HTTP 403') || msg.includes('too small')) throw err;
      if (i < attempts) {
        const wait = Math.pow(2, i - 1) * 1000;
        console.log(`    ↻ ${label} attempt ${i} failed: ${msg}. Retry in ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw last;
}

// ─── Database Access ──────────────────────────────────────────────────────────

async function connectDb() {
  const { Client } = require('pg');
  const client = new Client({
    host: CONFIG.db.host, port: CONFIG.db.port,
    database: CONFIG.db.database,
    user: CONFIG.db.user, password: CONFIG.db.password,
    ssl: CONFIG.db.ssl,
  });
  await client.connect();
  await client.query(`SET search_path TO "${CONFIG.db.schema}", public`);
  return client;
}

async function fetchPage(client, offset, pageSize, productId = null) {
  if (productId) {
    const r = await client.query('SELECT id, name FROM products WHERE id = $1', [productId]);
    return r.rows;
  }
  const r = await client.query(
    'SELECT id, name FROM products ORDER BY created_at ASC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  );
  return r.rows;
}

async function fetchUrls(client, productId) {
  const imgs = await client.query(
    'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY ctid', [productId]
  );
  const vids = await client.query(
    'SELECT video_url FROM product_videos WHERE product_id = $1 ORDER BY ctid', [productId]
  );
  return { imageUrls: imgs.rows.map(r => r.image_url), videoUrls: vids.rows.map(r => r.video_url) };
}

// Fix 5: SQL-aggregated provider counting — no full table scan into Node memory.
async function countByProvider(client) {
  const prodCnt = await client.query('SELECT COUNT(*) FROM products');

  // Use SQL CASE expressions to bucket URLs by provider pattern in the DB.
  const imgQ = await client.query(`
    SELECT
      SUM(CASE WHEN image_url LIKE '%res.cloudinary.com%' THEN 1 ELSE 0 END) AS cloudinary,
      SUM(CASE WHEN image_url LIKE '%ik.imagekit.io%'     THEN 1 ELSE 0 END) AS imagekit,
      SUM(CASE WHEN image_url LIKE '%b-cdn.net%'
                OR image_url LIKE '%bunnycdn.com%'        THEN 1 ELSE 0 END) AS bunny,
      SUM(CASE WHEN image_url NOT LIKE '%res.cloudinary.com%'
               AND image_url NOT LIKE '%ik.imagekit.io%'
               AND image_url NOT LIKE '%b-cdn.net%'
               AND image_url NOT LIKE '%bunnycdn.com%'    THEN 1 ELSE 0 END) AS unknown
    FROM product_images
  `);
  const vidQ = await client.query(`
    SELECT
      SUM(CASE WHEN video_url LIKE '%res.cloudinary.com%' THEN 1 ELSE 0 END) AS cloudinary,
      SUM(CASE WHEN video_url LIKE '%ik.imagekit.io%'     THEN 1 ELSE 0 END) AS imagekit,
      SUM(CASE WHEN video_url LIKE '%b-cdn.net%'
                OR video_url LIKE '%bunnycdn.com%'        THEN 1 ELSE 0 END) AS bunny,
      SUM(CASE WHEN video_url NOT LIKE '%res.cloudinary.com%'
               AND video_url NOT LIKE '%ik.imagekit.io%'
               AND video_url NOT LIKE '%b-cdn.net%'
               AND video_url NOT LIKE '%bunnycdn.com%'    THEN 1 ELSE 0 END) AS unknown
    FROM product_videos
  `);

  const ir = imgQ.rows[0];
  const vr = vidQ.rows[0];
  return {
    products  : parseInt(prodCnt.rows[0].count, 10),
    cloudinary: { images: parseInt(ir.cloudinary||0,10), videos: parseInt(vr.cloudinary||0,10) },
    imagekit  : { images: parseInt(ir.imagekit||0,10),   videos: parseInt(vr.imagekit||0,10)   },
    bunny     : { images: parseInt(ir.bunny||0,10),       videos: parseInt(vr.bunny||0,10)       },
    unknown   : { images: parseInt(ir.unknown||0,10),     videos: parseInt(vr.unknown||0,10)     },
  };
}

// Fix 4: Direct DB update — update only the image/video rows for this product.
//
// Schema verification (Product.java, lines 56-66):
//   product_images: @ElementCollection mapped as (product_id UUID FK, image_url TEXT)
//   product_videos: @ElementCollection mapped as (product_id UUID FK, video_url TEXT)
//
// These are pure @ElementCollection tables — they contain ONLY product_id + the
// value column. There are NO surrogate IDs, NO created_at, NO metadata columns.
// Hibernate itself uses DELETE-all + re-insert on every Product.save(), so this
// approach is safe and idiomatic for this schema.
async function dbUpdateUrls(client, productId, newImageUrls, newVideoUrls) {
  // Wrap in a transaction so both tables are updated atomically.
  await client.query('BEGIN');
  try {
    // Delete existing rows for this product then re-insert in order.
    await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
    for (const url of newImageUrls) {
      await client.query(
        'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
        [productId, url]
      );
    }
    await client.query('DELETE FROM product_videos WHERE product_id = $1', [productId]);
    for (const url of newVideoUrls) {
      await client.query(
        'INSERT INTO product_videos (product_id, video_url) VALUES ($1, $2)',
        [productId, url]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ─── Single Asset Migration ───────────────────────────────────────────────────

async function migrateAsset(productId, assetType, index, sourceUrl) {
  const key = assetKey(productId, assetType, index);
  let as = getAS(key);

  // Safeguard: if the DB URL has changed since the last run for this index,
  // we must treat it as a new asset. We archive the old state so we don't
  // overwrite/lose its original sourceUrl (which is needed for rollbacks).
  if (as && as.sourceUrl !== sourceUrl) {
    console.log(`    URL changed for index ${index}. Archiving old state.`);
    STATE.assets[`${key}:archived:${Date.now()}`] = as;
    as = null;
  }

  if (!as) {
    as = {
      productId, assetType, assetIndex: index,
      sourceProvider: detectProvider(sourceUrl),
      sourceUrl,                                  // NEVER overwritten — rollback reference
      bunnyPath: null, bunnyUrl: null,
      status: 'pending', attempts: 0, error: null, migratedAt: null,
    };
    // Bypass setAS() spread merge to ensure a clean overwrite for the active key
    STATE.assets[key] = as;
    saveState();
  }

  const provider = as.sourceProvider;

  // Filter by --provider
  if (FILTER_PROVIDER && provider !== FILTER_PROVIDER)
    return { skipped: true, reason: `provider mismatch` };

  // Already fully done (upload verified AND DB confirmed)
  if (as.status === 'completed')
    return { skipped: true, bunnyUrl: as.bunnyUrl };

  // bunny_uploaded = upload verified but DB update never confirmed.
  // Return bunnyUrl so the caller can include it in the DB update batch.
  // Do NOT skip — the product-level code will redo the DB update.
  if (as.status === 'bunny_uploaded')
    return { success: true, bunnyUrl: as.bunnyUrl, skippedUpload: true };

  // Already on Bunny (source URL is already a Bunny URL — no upload needed)
  if (provider === 'bunny') {
    setAS(key, { status: 'completed', bunnyUrl: sourceUrl, migratedAt: new Date().toISOString() });
    return { skipped: true, bunnyUrl: sourceUrl };
  }

  // Unknown — skip
  if (provider === 'unknown')
    return { skipped: true, reason: 'unknown provider' };

  // Retry-failed filter: pass through failed, bunny_uploaded (DB pending),
  // and uploading/verifying (crash mid-transfer — safe to re-upload).
  if (RETRY_FAILED &&
      as.status !== 'failed' &&
      as.status !== 'bunny_uploaded' &&
      as.status !== 'uploading' &&
      as.status !== 'verifying')
    return { skipped: true, reason: 'not failed' };

  as.attempts = (as.attempts || 0) + 1;
  setAS(key, { status: 'downloading', attempts: as.attempts, error: null });

  // Step 1 — get original URL (strip transforms)
  const downloadUrl = provider === 'cloudinary'
    ? CloudinaryProvider.getOriginalUrl(sourceUrl)
    : provider === 'imagekit'
      ? ImageKitProvider.getOriginalUrl(sourceUrl)
      : sourceUrl;

  // Step 2 — download (streaming for video, buffered for images)
  const isVideo = assetType === 'video';
  let buffer = null;          // only set for images
  let streamFactory = null;   // only set for videos — function that opens a fresh stream
  let contentType, sourceSize;

  try {
    console.log(`      ↓ ${downloadUrl.substring(0, 90)}`);
    if (isVideo) {
      // Fix 2: Probe with HEAD to get Content-Type + Content-Length without
      // downloading the file. Some CDNs (e.g. Cloudinary's stream endpoint
      // for .m3u8, or ImageKit signed URLs) respond 405/403 to HEAD.
      // In those cases, fall back to a Range: bytes=0-0 GET which is universally
      // supported and consumes only 1 byte of the response body.
      let probeOk = false;
      try {
        const probe = await withRetry(() =>
          fetchTimeout(downloadUrl, { method: 'HEAD', headers: { 'User-Agent': 'KicksAura-Migration/1.0' } }),
          CONFIG.migration.maxRetries, 'HEAD probe');
        // Accept 200 and 206; treat anything else as unsupported HEAD
        if (probe.status === 200 || probe.status === 206) {
          contentType = guessContentType(downloadUrl, probe.headers.get('content-type') || '');
          sourceSize  = parseInt(probe.headers.get('content-length') || '0', 10) || null;
          probeOk     = true;
          console.log(`        Probed via HEAD (${sourceSize ? (sourceSize/1024/1024).toFixed(1)+' MB' : '?'}, ${contentType})`);
        }
      } catch { /* HEAD failed — fall through to GET fallback */ }

      if (!probeOk) {
        // Fallback: single-byte range GET — cheap and universally supported.
        const rangeRes = await withRetry(() =>
          fetchTimeout(downloadUrl, {
            method : 'GET',
            headers: { 'User-Agent': 'KicksAura-Migration/1.0', Range: 'bytes=0-0' },
          }),
          CONFIG.migration.maxRetries, 'Range probe');
        // 206 Partial Content is ideal; some servers return 200 with the full body.
        if (!rangeRes.ok && rangeRes.status !== 206)
          console.log(`        Probe bypassed: HTTP ${rangeRes.status}`);
        // Drain the minimal body to free the connection.
        await rangeRes.body?.cancel().catch(() => {});
        contentType = guessContentType(downloadUrl, rangeRes.headers.get('content-type') || '');
        // Content-Range: bytes 0-0/TOTAL — extract total size
        const cr = rangeRes.headers.get('content-range') || '';
        const crMatch = cr.match(/\/(\d+)$/);
        sourceSize = crMatch ? parseInt(crMatch[1], 10) : null;
        if (!sourceSize) {
          // Last resort: server returned full body on 200 — no reliable size
          sourceSize = parseInt(rangeRes.headers.get('content-length') || '0', 10) || null;
        }
        console.log(`        Probed via Range GET (${sourceSize ? (sourceSize/1024/1024).toFixed(1)+' MB' : '?'}, ${contentType})`);
      }

      streamFactory = () => openDownloadStream(downloadUrl);
    } else {
      const r = await withRetry(() => downloadBuffer(downloadUrl), CONFIG.migration.maxRetries, 'Download');
      buffer = r.buffer; contentType = guessContentType(downloadUrl, r.contentType); sourceSize = r.size;
      console.log(`        OK (${(buffer.length/1024).toFixed(1)} KB, ${contentType})`);
    }
  } catch (err) {
    const msg = `Download failed: ${err.message}`;
    setAS(key, { status: 'failed', error: msg });
    return { failed: true, error: msg };
  }

  // Step 3 — build Bunny path
  const ext       = guessExt(downloadUrl, contentType);
  const bunnyPath = BunnyProvider.buildPath(productId, assetType, index, ext);
  setAS(key, { status: 'uploading', bunnyPath });

  // Fix 6: Better Bunny duplicate detection.
  // For images we have the buffer size; for videos we have sourceSize from probe.
  const existing = await BunnyProvider.stat(bunnyPath);
  if (existing.exists && existing.size > 0) {
    const knownSize = buffer ? buffer.length : sourceSize;
    if (knownSize && existing.size === knownSize) {
      // Exact size match — definitely the same file.
      const bunnyUrl = BunnyProvider.cdnUrl(bunnyPath);
      console.log(`        Bunny already has exact file (${existing.size}B) — skipping upload.`);
      // Fix 1 (state): mark bunny_uploaded but NOT completed yet — DB must confirm.
      setAS(key, { status: 'bunny_uploaded', bunnyUrl });
      return { success: true, bunnyUrl, skippedUpload: true };
    } else if (knownSize && Math.abs(existing.size - knownSize) / knownSize < 0.02) {
      // Within 2% — re-upload to be safe (transcodes can cause tiny variance).
      console.log(`        Bunny has file of similar size but not exact; re-uploading.`);
    }
  }

  // Step 5 — upload
  // State is already 'uploading' (set above). We do NOT advance to
  // bunny_uploaded until AFTER verification succeeds (Fix 1).
  // For videos each withRetry attempt opens a FRESH stream (Fix 2).
  let bunnyUrl;
  try {
    console.log(`      ↑ ${bunnyPath}`);
    if (isVideo) {
      // Wrap the entire open-stream + upload in a single withRetry so that
      // each retry gets a new TCP connection and a fresh, unconsumed stream.
      // A stream that was partially consumed by a failed upload cannot be
      // reused — the factory must be called again inside the retry loop.
      bunnyUrl = await withRetry(async () => {
        const { stream, size: streamSize } = await streamFactory();
        return BunnyProvider.upload(stream, bunnyPath, contentType, streamSize || sourceSize);
      }, CONFIG.migration.maxRetries, 'Upload');
    } else {
      bunnyUrl = await withRetry(
        () => BunnyProvider.upload(buffer, bunnyPath, contentType, buffer.length),
        CONFIG.migration.maxRetries, 'Upload');
    }
    console.log(`        OK → ${bunnyUrl}`);
  } catch (err) {
    const msg = `Upload failed: ${err.message}`;
    setAS(key, { status: 'failed', error: msg });
    return { failed: true, error: msg };
  }

  // Step 6 — verify Bunny upload
  // Only advance to bunny_uploaded AFTER verify passes (Fix 1).
  // If we crash between upload and verify, status remains 'uploading'
  // which is treated like 'pending' on re-run — safe to re-upload.
  setAS(key, { status: 'verifying' });
  try {
    const v = await withRetry(() => BunnyProvider.stat(bunnyPath), CONFIG.migration.maxRetries, 'Verify');
    if (!v.exists) throw new Error('File not found in Bunny after upload');
    if (v.size === 0) throw new Error('File in Bunny is 0 bytes');
    console.log(`        Verified (${v.size}B in Bunny)`);
  } catch (err) {
    const msg = `Verify failed: ${err.message}`;
    // Keep bunnyUrl in state for diagnostics but mark failed so re-run re-uploads.
    setAS(key, { status: 'failed', error: msg, bunnyUrl });
    return { failed: true, error: msg };
  }

  // Verification passed — safe to mark bunny_uploaded.
  // Caller marks 'completed' only AFTER DB update succeeds (Fix 1).
  setAS(key, { status: 'bunny_uploaded', bunnyUrl, error: null });
  return { success: true, bunnyUrl };

}

// ─── Single Product Migration ─────────────────────────────────────────────────

async function migrateProduct(client, productId, name, idx, total) {
  console.log(`\n[${idx}/${total}] ${name} (${productId})`);
  const { imageUrls, videoUrls } = await fetchUrls(client, productId);
  const totalMedia = imageUrls.length + videoUrls.length;
  if (totalMedia === 0) { console.log('  No media — skipping.'); return { productId, success: true, skipped: true }; }

  const stats = { imagesSuccess:0, imagesFailed:0, imagesSkipped:0, videosSuccess:0, videosFailed:0, videosSkipped:0 };
  const newImages = [...imageUrls];
  const newVideos = [...videoUrls];
  let anyChange = false;

  const processAssets = async (urls, newArr, assetType, statsPrefix) => {
    for (let i = 0; i < urls.length; i++) {
      const url      = urls[i];
      const provider = detectProvider(url);
      console.log(`  ${assetType === 'image' ? 'Image' : 'Video'} ${i+1}/${urls.length} [${provider}]`);

      if (DRY_RUN) {
        if (provider !== 'bunny' && provider !== 'unknown')
          console.log(`    [DRY RUN] Would migrate from ${provider}: ${url.substring(0, 80)}`);
        else
          console.log(`    [DRY RUN] Already on ${provider} — no action.`);
        stats[statsPrefix + 'Skipped']++;
        continue;
      }

      const result = await migrateAsset(productId, assetType, i, url);
      if (result.success) {
        if (!result.skippedUpload) stats[statsPrefix + 'Success']++;
        else stats[statsPrefix + 'Skipped']++;
        if (result.bunnyUrl && result.bunnyUrl !== url) { newArr[i] = result.bunnyUrl; anyChange = true; }
      } else if (result.skipped) {
        stats[statsPrefix + 'Skipped']++;
        const as = getAS(assetKey(productId, assetType, i));
        if (as?.bunnyUrl && as.bunnyUrl !== url) { newArr[i] = as.bunnyUrl; anyChange = true; }
      } else {
        stats[statsPrefix + 'Failed']++;
        console.log(`    ✗ FAILED: ${result.error}`);
      }
    }
  };

  await processAssets(imageUrls, newImages, 'image', 'images');
  await processAssets(videoUrls, newVideos, 'video', 'videos');

  // Fix 1: Update DB FIRST, then mark assets completed.
  // Assets in bunny_uploaded state have been verified in Bunny but not yet
  // reflected in the DB. If this step fails, re-running will redo the DB
  // update (uploads are idempotent via the exact-size check above).
  if (!DRY_RUN && anyChange) {
    console.log('  → Updating database...');
    try {
      await withRetry(
        () => dbUpdateUrls(client, productId, newImages, newVideos),
        CONFIG.migration.maxRetries, 'DB update');
      console.log('  ✓ Database updated.');
      // Fix 1: Only NOW mark every successfully uploaded asset as completed.
      for (let i = 0; i < imageUrls.length; i++) {
        const k = assetKey(productId, 'image', i);
        const as = getAS(k);
        if (as && as.status === 'bunny_uploaded') {
          setAS(k, { status: 'completed', migratedAt: new Date().toISOString() });
        }
      }
      for (let i = 0; i < videoUrls.length; i++) {
        const k = assetKey(productId, 'video', i);
        const as = getAS(k);
        if (as && as.status === 'bunny_uploaded') {
          setAS(k, { status: 'completed', migratedAt: new Date().toISOString() });
        }
      }
    } catch (err) {
      console.log(`  ✗ DB update FAILED: ${err.message}`);
      // Assets remain in bunny_uploaded — next run will retry the DB update.
      return { productId, success: false, error: `DB update failed: ${err.message}`, stats };
    }
  } else if (!DRY_RUN) {
    // No DB change needed (all skipped or already on Bunny) — mark completed.
    for (let i = 0; i < imageUrls.length; i++) {
      const k = assetKey(productId, 'image', i);
      const as = getAS(k);
      if (as && as.status === 'bunny_uploaded') setAS(k, { status: 'completed', migratedAt: new Date().toISOString() });
    }
    for (let i = 0; i < videoUrls.length; i++) {
      const k = assetKey(productId, 'video', i);
      const as = getAS(k);
      if (as && as.status === 'bunny_uploaded') setAS(k, { status: 'completed', migratedAt: new Date().toISOString() });
    }
  }

  const failed = stats.imagesFailed + stats.videosFailed > 0;
  console.log(
    `  ${failed ? 'PARTIAL' : 'COMPLETE'} — Img ✓${stats.imagesSuccess} ✗${stats.imagesFailed} ↷${stats.imagesSkipped}` +
    ` | Vid ✓${stats.videosSuccess} ✗${stats.videosFailed} ↷${stats.videosSkipped}`
  );
  return { productId, success: !failed, stats };
}

// ─── Validate Mode ────────────────────────────────────────────────────────────

async function runValidation(client) {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Kicks Aura — Migration Validation    ║');
  console.log('╚═══════════════════════════════════════╝\n');
  const c = await countByProvider(client);
  console.log(`Products scanned      : ${c.products}`);
  console.log(`\nImages:`);
  console.log(`  Cloudinary          : ${c.cloudinary.images}`);
  console.log(`  ImageKit            : ${c.imagekit.images}`);
  console.log(`  Bunny               : ${c.bunny.images}`);
  console.log(`  Unknown             : ${c.unknown.images}`);
  console.log(`\nVideos:`);
  console.log(`  Cloudinary          : ${c.cloudinary.videos}`);
  console.log(`  ImageKit            : ${c.imagekit.videos}`);
  console.log(`  Bunny               : ${c.bunny.videos}`);
  console.log(`  Unknown             : ${c.unknown.videos}`);
  const allA     = Object.values(STATE.assets);
  const failed   = allA.filter(a => a.status === 'failed');
  const done     = allA.filter(a => a.status === 'completed');
  console.log(`\nState file:`);
  console.log(`  Tracked             : ${allA.length}`);
  console.log(`  Completed           : ${done.length}`);
  console.log(`  Failed              : ${failed.length}`);
  const remaining = c.cloudinary.images + c.cloudinary.videos + c.imagekit.images + c.imagekit.videos;
  if (remaining === 0) {
    console.log('\n✅ Migration PASSED — no Cloudinary/ImageKit references remain.');
  } else {
    console.log(`\n⚠️  INCOMPLETE — ${remaining} assets still on old providers.`);
    if (failed.length > 0) {
      console.log('\nFailed assets:');
      failed.slice(0,20).forEach(a => console.log(`  - ${a.productId} [${a.assetType}:${a.assetIndex}] ${a.error}`));
      if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more (see migration_state.json)`);
    }
  }
}

// ─── Dry-Run Summary ──────────────────────────────────────────────────────────

async function runDryRun(client) {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Kicks Aura — Media Migration         ║');
  console.log('║           DRY RUN MODE                 ║');
  console.log('╚═══════════════════════════════════════╝\n');
  const c = await countByProvider(client);
  console.log(`Products found        : ${c.products}`);
  console.log(`\nCloudinary:  images=${c.cloudinary.images}  videos=${c.cloudinary.videos}`);
  console.log(`ImageKit:    images=${c.imagekit.images}  videos=${c.imagekit.videos}`);
  console.log(`Already Bunny: images=${c.bunny.images}  videos=${c.bunny.videos}`);
  console.log(`Unknown:     images=${c.unknown.images}  videos=${c.unknown.videos}`);
  const total = c.cloudinary.images + c.cloudinary.videos + c.imagekit.images + c.imagekit.videos;
  console.log(`\nTotal assets to migrate : ${total}`);
  console.log('\n✅ Dry run complete. No changes made.\n');
}

// ─── Main Migration Loop ──────────────────────────────────────────────────────

async function runMigration(client) {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Kicks Aura — Media Migration         ║');
  if (RETRY_FAILED)    console.log('║       RETRY FAILED MODE                ║');
  if (FILTER_PROVIDER) console.log(`║       Provider: ${FILTER_PROVIDER.padEnd(22)}║`);
  if (FILTER_PRODUCT)  console.log('║       Single Product Mode              ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const c = await countByProvider(client);
  const toMigrate = c.cloudinary.images + c.cloudinary.videos + c.imagekit.images + c.imagekit.videos;
  console.log(`Products: ${c.products} | To migrate: ${toMigrate} | Already Bunny: ${c.bunny.images + c.bunny.videos}\n`);

  const gs = {
    productsProcessed:0, productsSucceeded:0, productsFailed:0,
    imagesSuccess:0, imagesFailed:0, imagesSkipped:0,
    videosSuccess:0, videosFailed:0, videosSkipped:0,
    failedProducts:[],
  };

  // Single product mode
  if (FILTER_PRODUCT) {
    const rows = await fetchPage(client, 0, 1, FILTER_PRODUCT);
    if (rows.length === 0) { console.error(`❌ Product ${FILTER_PRODUCT} not found.`); return; }
    await migrateProduct(client, String(rows[0].id), rows[0].name, 1, 1);
    printReport(gs); return;
  }

  // Paginated
  const totalR = await client.query('SELECT COUNT(*) FROM products');
  const total  = parseInt(totalR.rows[0].count, 10);
  const effective = LIMIT ? Math.min(LIMIT, total) : total;
  let offset = 0, processed = 0, prodIdx = 0;

  while (true) {
    const rows = await fetchPage(client, offset, CONFIG.migration.pageSize);
    if (rows.length === 0) break;
    for (const row of rows) {
      if (LIMIT && processed >= LIMIT) break;
      prodIdx++; processed++;
      const result = await migrateProduct(client, String(row.id), row.name, prodIdx, effective);
      gs.productsProcessed++;
      if (result.skipped) continue;
      if (result.success) {
        gs.productsSucceeded++;
        gs.imagesSuccess += result.stats?.imagesSuccess || 0;
        gs.imagesFailed  += result.stats?.imagesFailed  || 0;
        gs.imagesSkipped += result.stats?.imagesSkipped || 0;
        gs.videosSuccess += result.stats?.videosSuccess || 0;
        gs.videosFailed  += result.stats?.videosFailed  || 0;
        gs.videosSkipped += result.stats?.videosSkipped || 0;
      } else {
        gs.productsFailed++;
        gs.failedProducts.push({ id: row.id, name: row.name, error: result.error });
        gs.imagesFailed += result.stats?.imagesFailed || 0;
        gs.videosFailed += result.stats?.videosFailed || 0;
      }
    }
    if (LIMIT && processed >= LIMIT) break;
    offset += CONFIG.migration.pageSize;
    if (rows.length < CONFIG.migration.pageSize) break;
  }

  printReport(gs);
}

function printReport(s) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Migration Complete');
  console.log('═══════════════════════════════════════════');
  console.log(`  Products processed  : ${s.productsProcessed}`);
  console.log(`  Succeeded           : ${s.productsSucceeded}`);
  console.log(`  Failed              : ${s.productsFailed}`);
  console.log(`  Images: ✓${s.imagesSuccess}  ✗${s.imagesFailed}  ↷${s.imagesSkipped}`);
  console.log(`  Videos: ✓${s.videosSuccess}  ✗${s.videosFailed}  ↷${s.videosSkipped}`);
  if (s.failedProducts.length > 0) {
    console.log('\n  Failed products:');
    s.failedProducts.forEach(p => console.log(`    - ${p.id} (${p.name}): ${p.error || 'see migration_state.json'}`));
    console.log('\n  Re-run with --retry-failed to retry failed assets.');
  }
  console.log('\n  Run --validate to confirm completeness.');
  console.log('═══════════════════════════════════════════\n');
}

// ─── SIGINT / SIGTERM ─────────────────────────────────────────────────────────

process.on('SIGINT',  () => { saveState(); console.log('\n⚠️  Interrupted. State saved.'); process.exit(0); });
process.on('SIGTERM', () => { saveState(); console.log('\n⚠️  SIGTERM. State saved.');    process.exit(0); });

// ─── Entry ────────────────────────────────────────────────────────────────────

(async () => {
  validateEnv();
  loadState();

  let pgOk = true;
  try { require.resolve('pg'); } catch { pgOk = false; }
  if (!pgOk) {
    console.error('❌ "pg" not installed. Run: cd importer && npm install pg');
    process.exit(1);
  }

  const client = await connectDb();
  console.log('✓ Connected to PostgreSQL');

  try {
    if (VALIDATE_MODE)    await runValidation(client);
    else if (DRY_RUN)     await runDryRun(client);
    else                  await runMigration(client);
  } finally {
    await client.end();
  }
})();
