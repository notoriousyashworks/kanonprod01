# Kicks Aura — Media Migration to Bunny.net

This document explains how to migrate all product images and videos from Cloudinary and ImageKit to Bunny.net Storage + CDN.

> **IMPORTANT:** This migration is **non-destructive**. It never deletes assets from Cloudinary or ImageKit.

---

## Overview

### Current Architecture
| Field | Table | Provider(s) |
|---|---|---|
| `product_images.image_url` | `prod.product_images` | Cloudinary (`res.cloudinary.com`) or ImageKit (`ik.imagekit.io`) |
| `product_videos.video_url` | `prod.product_videos` | Cloudinary or ImageKit |

### After Migration
All URLs will be replaced with Bunny CDN URLs in the pattern:
```
https://<BUNNY_CDN_BASE_URL>/products/<productId>/images/img-01.jpg
https://<BUNNY_CDN_BASE_URL>/products/<productId>/videos/vid-01.mp4
```

### Rollback
The original source URLs are **always preserved** in `importer/migration_state.json` under `sourceUrl`. To roll back, use the API to restore the original URLs from the state file.

---

## Prerequisites

1. **Node.js v18+** (for native `fetch`)
2. **`pg` package** — install if not present:
   ```bash
   cd importer && npm install pg
   ```
3. **Direct PostgreSQL access** — the script connects directly to Postgres to read product data and uses the REST API to write (update) product records.
4. **Bunny.net account** with a Storage Zone and CDN Pull Zone configured.

---

## Environment Variables

Add these to your root `.env` file:

```env
# Bunny.net — REQUIRED for migration
BUNNY_STORAGE_ZONE=your-storage-zone-name
BUNNY_STORAGE_API_KEY=your-storage-password-api-key
BUNNY_STORAGE_HOST=storage.bunnycdn.com
BUNNY_CDN_BASE_URL=https://your-pullzone.b-cdn.net

# Optional tuning
MIGRATION_CONCURRENCY=1     # Keep at 1; increase only if you have headroom
MIGRATION_MAX_RETRIES=3     # Per-asset retry attempts
```

The script also uses the existing variables already in your `.env`:
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- `JWT_SECRET`
- `KICKSAURA_API_URL` (defaults to Railway URL if not set)

---

## Commands

From the project root, all commands are run as:
```bash
node importer/migrate_media_to_bunny.js [options]
```

Or using the npm scripts (after adding them to `importer/package.json`):
```bash
cd importer && npm run migrate:media -- [options]
```

### Available Options

| Command | Description |
|---|---|
| `--dry-run` | Scan the database and report what *would* be migrated. Makes **zero** changes. |
| *(no flags)* | Run the full migration. |
| `--provider cloudinary` | Migrate only Cloudinary assets. |
| `--provider imagekit` | Migrate only ImageKit assets. |
| `--product <uuid>` | Migrate a single product by its UUID. |
| `--limit 10` | Migrate only the first N products. |
| `--retry-failed` | Re-attempt only previously failed assets. |
| `--validate` | Scan the database and report remaining Cloudinary/ImageKit references. |

---

## Step-by-Step Instructions

### 1. Dry Run First
Always start with a dry run to understand the scope:
```bash
node importer/migrate_media_to_bunny.js --dry-run
```

Example output:
```
Products found        : 2,487
Cloudinary:  images=1832  videos=421
ImageKit:    images=1204  videos=587
Already Bunny: images=0  videos=0
Unknown:     images=0  videos=0

Total assets to migrate : 4044

✅ Dry run complete. No changes made.
```

### 2. Test with a Single Product
```bash
node importer/migrate_media_to_bunny.js --product <your-product-uuid>
```

### 3. Test with a Small Batch
```bash
node importer/migrate_media_to_bunny.js --limit 5
```

Verify the results in your Bunny storage dashboard and on the live site.

### 4. Migrate by Provider
Migrate Cloudinary first, then ImageKit:
```bash
node importer/migrate_media_to_bunny.js --provider cloudinary
node importer/migrate_media_to_bunny.js --provider imagekit
```

Or migrate everything at once:
```bash
node importer/migrate_media_to_bunny.js
```

### 5. Resume After Interruption
If the script is stopped (Ctrl+C, Railway restart, etc.), simply re-run the same command. The script reads `migration_state.json` and skips all already-completed assets automatically:
```bash
node importer/migrate_media_to_bunny.js
```

### 6. Retry Failed Assets
```bash
node importer/migrate_media_to_bunny.js --retry-failed
```

### 7. Validate Completion
```bash
node importer/migrate_media_to_bunny.js --validate
```

Example of a passing validation:
```
Products scanned      : 2,487
Images:
  Cloudinary          : 0
  ImageKit            : 0
  Bunny               : 3036
  Unknown             : 0
Videos:
  Cloudinary          : 0
  ImageKit            : 0
  Bunny               : 1008
  Unknown             : 0

✅ Migration PASSED — no Cloudinary/ImageKit references remain.
```

---

## How It Works

### Idempotency
- Each asset is tracked in `importer/migration_state.json` by a unique key: `{productId}:{type}:{index}`.
- Before uploading, the script checks if the file already exists in Bunny Storage (by size comparison).
- Assets with `status: completed` are always skipped.

### URL Stripping
- **Cloudinary**: Transformation parameters between `/upload/` and the public ID are stripped (e.g., `f_auto,q_auto,w_800` is removed).
- **ImageKit**: `?tr=...` query parameters and `/tr:../` path segments are removed before downloading.

### DB Updates
- The script uses a **GET then PUT** strategy against the admin REST API.
- It fetches the complete product, replaces only the `imageUrls` and `videoUrls` arrays, and PUTs the whole payload back.
- The DB is only updated **after** the Bunny upload is verified.
- If only 2 of 5 images succeed, only those 2 URLs are updated; the remaining 3 keep their original values.

---

## Rollback

Because `migration_state.json` always stores the original `sourceUrl` for every asset, you can write a rollback script that:
1. Reads `migration_state.json`.
2. For every `completed` asset, finds the product via the API.
3. Replaces the Bunny URL with the original `sourceUrl`.
4. PUTs the product back.

The original Cloudinary and ImageKit files are **never touched**, so this is always safe.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `❌ "pg" not installed` | `pg` package missing | `cd importer && npm install pg` |
| `❌ Missing required env variables` | Bunny/DB env vars not set | Add them to root `.env` |
| Download `HTTP 403` | Cloudinary/ImageKit access restricted | Check provider credentials; these assets will be marked `failed` and skipped |
| Download `HTTP 404` | Asset deleted at source | Expected for some legacy assets; marked `failed` and skipped automatically |
| Bunny upload `HTTP 401` | Wrong `BUNNY_STORAGE_API_KEY` | Check the key in your Bunny dashboard → Storage Zone → FTP & API Access |
| API PUT fails | JWT expired or wrong `KICKSAURA_API_URL` | Verify `JWT_SECRET` and `KICKSAURA_API_URL` |

---

## Memory & Performance Notes

- The script processes **one asset at a time** by default (`MIGRATION_CONCURRENCY=1`).
- Products are fetched in pages of 50 from the DB — no large in-memory datasets.
- Buffers are downloaded, uploaded, and then released between assets.
- Safe to run on a Railway instance with limited RAM.
