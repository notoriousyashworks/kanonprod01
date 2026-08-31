# ImageKit Integration — Kicks Aura

## Overview

New product images and videos are uploaded to **ImageKit** via a browser-direct flow
authenticated by a server-signed token.

Existing products using **Cloudinary** URLs are completely unaffected. No migration,
no re-upload, no schema change.

---

## Architecture

```
Admin selects file
  └─► Admin JS calls GET /api/v1/admin/imagekit/auth  (short-lived token)
  └─► product-service signs token with IMAGEKIT_PRIVATE_KEY (server-only)
  └─► Response: { token, expire, signature, publicKey, urlEndpoint }
  └─► Admin JS POSTs file directly to https://upload.imagekit.io/api/v1/files/upload
  └─► ImageKit returns { url: "https://ik.imagekit.io/..." }
  └─► URL stored in _uploaderState → saved to product via existing product API
```

---

## ImageKit Account Configuration

1. Log in to [imagekit.io/dashboard](https://imagekit.io/dashboard)
2. Go to **Settings → API Keys**
3. Copy your **Public Key** and **Private Key**
4. Go to **Settings → URL Endpoints** — copy the default URL endpoint
   (looks like: `https://ik.imagekit.io/YOUR_IMAGEKIT_ID`)
5. Go to **Settings → Upload Preferences** and ensure **server-side upload** is enabled
   (Private key uploads are enabled by default — no extra config required)

---

## Environment Variables

### Root `.env` (local development):

```bash
# SERVER-SIDE ONLY — product-service container reads this.
# NEVER add to any Vite build arg or frontend bundle.
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxxxxxxxxx

# Safe for admin Vite build / browser (these are not secrets)
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### Docker / Production:

The `docker-compose.yml` already wires these:

| Variable | Goes to |
|---|---|
| `IMAGEKIT_PRIVATE_KEY` | `product-service` environment (server-only) |
| `IMAGEKIT_PUBLIC_KEY` | `admin` build args → `VITE_IMAGEKIT_PUBLIC_KEY` |
| `IMAGEKIT_URL_ENDPOINT` | `admin` build args → `VITE_IMAGEKIT_URL_ENDPOINT` |

---

## API Endpoint

**`GET /api/v1/admin/imagekit/auth`**

- Routed by API gateway → `product-service`
- Protected by JWT (`ROLE_ADMIN` required — enforced by `AuthenticationFilter`)
- Returns:
  ```json
  {
    "token":       "uuid-nonce",
    "expire":      1234567890,
    "signature":   "hex-hmac-sha256",
    "publicKey":   "public_xxxx",
    "urlEndpoint": "https://ik.imagekit.io/your_id"
  }
  ```
- Token validity: 30 minutes
- Signing algorithm: `HMAC-SHA256(privateKey, token + expire)`

---

## Folder Structure in ImageKit

| Content | Folder |
|---|---|
| Product images | `kicks-aura/products/images/` |
| Product videos | `kicks-aura/products/videos/` |
| (Cloudinary) Categories | `kicks-aura/categories/` — unchanged, still Cloudinary |
| (Cloudinary) Reviews | `kicks-aura/reviews/` — unchanged, still Cloudinary |

Filenames are unique: `{timestamp}-{random}-{sanitized-original-name}`

---

## Image Handling

- Uploaded via `uploadToImageKit()` in `admin/admin.js`
- Stored as `https://ik.imagekit.io/...` URLs in `product_images.image_url`
- Transformed at display time by `formatImageKitUrl()` → `tr=q-auto,f-auto,w-800`
- `formatMediaUrl()` (new dispatch function) routes to the correct transform

---

## Video Handling

- Uploaded via `uploadToImageKit()` with `resourceType='video'`
- Stored as raw ImageKit video URLs in `product_videos.video_url`
- Transformed at display time:
  - Poster: `tr=so-0,f-jpg,w-800,q-auto` (first frame as JPEG)
  - MP4: `tr=f-mp4,q-auto`
  - HLS: Raw URL returned (HLS.js will attempt to load it; fails gracefully → MP4 fallback)
- The existing `initVideoPlayback()` in `product-details.js` already handles the
  HLS-fail → MP4-fallback path automatically

> **Note:** To enable HLS adaptive bitrate streaming for ImageKit videos, enable
> the **Adaptive Bitrate Streaming** add-on in your ImageKit plan. Once enabled,
> update `formatVideoHls()` in `ui.js` to return:
> `url.replace(/\.[^.]+$/, '') + '/ik-stream/master.m3u8'`

---

## Cloudinary Backward Compatibility

All five `formatCloudinary*` functions in `frontend/src/js/ui.js` are unchanged.

New provider-agnostic dispatch functions (`formatMediaUrl`, `formatVideoPoster`,
`formatVideoHls`, `formatVideoMp4`, `formatVideoHoverPreview`) inspect the URL
host and route accordingly:

| URL contains | Function used |
|---|---|
| `res.cloudinary.com` | Existing Cloudinary transform |
| `ik.imagekit.io` | New ImageKit transform |
| Anything else | Raw URL returned |

Category images and review images continue uploading to Cloudinary.

---

## Database

No schema changes. `imageUrls` and `videoUrls` remain `List<String>`.
New products store ImageKit URLs, old products store Cloudinary URLs — both are valid.

---

## Security

| Concern | Mitigation |
|---|---|
| Private key exposure | Key only in `product-service` env var; never returned in any response |
| Token replay | Tokens expire in 30 minutes |
| Admin-only endpoint | `ROLE_ADMIN` JWT required at API gateway |
| Arbitrary folder upload | Folder set server-side per upload context; browser cannot override |
| File type abuse | ImageKit rejects non-media types server-side |

---

## Files Changed

### Created
- `backend/product-service/.../service/ImageKitAuthService.java`
- `backend/product-service/.../controller/ImageKitAuthController.java`

### Modified
- `backend/product-service/src/main/resources/application.yml` — added imagekit config
- `backend/api-gateway/src/main/resources/application.yml` — added `/api/v1/admin/imagekit/**` route
- `.env` — added ImageKit placeholder vars
- `.env.example` — documented ImageKit vars
- `docker-compose.yml` — wired ImageKit vars to containers
- `admin/admin.js` — added `fetchImageKitAuth()`, `uploadToImageKit()`, swapped product uploader
- `frontend/src/js/ui.js` — added ImageKit helpers + dispatch functions
- `frontend/src/js/product-details.js` — uses dispatch functions for video rendering

### Intentionally Unchanged
- All backend Java entity/DTO/service/repository files
- `frontend/src/js/cart-sidebar.js`
- `frontend/src/js/checkout.js`
- `frontend/src/js/landing.js`
- `frontend/src/js/login-modal.js`
- All Cloudinary upload code for categories and reviews
