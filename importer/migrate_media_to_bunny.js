const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
let ADMIN_TOKEN = process.env.KICKSAURA_ADMIN_TOKEN || process.env.kicksaura_auth_token;

// Bunny Configuration
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST;
const BUNNY_CDN_BASE_URL = process.env.BUNNY_CDN_BASE_URL;

const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME;

const requiredEnv = [
    'BUNNY_STORAGE_API_KEY', 'BUNNY_STORAGE_ZONE', 'BUNNY_STORAGE_HOST', 'BUNNY_CDN_BASE_URL',
    'BUNNY_STREAM_LIBRARY_ID', 'BUNNY_STREAM_API_KEY', 'BUNNY_STREAM_CDN_HOSTNAME'
];

for (const env of requiredEnv) {
    if (!process.env[env]) {
        console.error(`FATAL: Missing required environment variable: ${env}`);
        process.exit(1);
    }
}

const STATE_FILE = path.join(__dirname, 'migration_state.json');

// Initialize state
let state = { processed: [], failed: {}, urlMap: {} };
if (fs.existsSync(STATE_FILE)) {
    const rawState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    state = {
        processed: rawState.processed || [],
        failed: rawState.failed || {},
        urlMap: rawState.urlMap || {}
    };
}
function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function isLegacyUrl(url) {
    if (!url) return false;
    return url.includes('res.cloudinary.com') || url.includes('ik.imagekit.io');
}

async function generateLocalJwt() {
    if (ADMIN_TOKEN) {
        console.log('Using existing ADMIN_TOKEN from env.');
        return;
    }
    console.log('Generating local JWT with ROLE_ADMIN...');
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error("JWT_SECRET is missing from .env (and KICKSAURA_ADMIN_TOKEN is empty).");
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'admin-migration-script', role: 'ROLE_ADMIN', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 };
    const b64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    const headerEnc = b64UrlEncode(header);
    const payloadEnc = b64UrlEncode(payload);
    const signature = crypto.createHmac('sha256', secretBytes).update(headerEnc + '.' + payloadEnc).digest('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    ADMIN_TOKEN = headerEnc + '.' + payloadEnc + '.' + signature;
    console.log('JWT generated successfully.');
}

async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
        throw new Error(`Invalid content-type: ${contentType}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('gif')) ext = 'gif';
    else if (contentType.includes('webp')) ext = 'webp';

    return { buffer: Buffer.from(arrayBuffer), ext };
}

async function uploadToBunnyStorage(buffer, filename, folder) {
    folder = folder.replace(/^\/+|\/+$/g, '');
    const url = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${folder}/${filename}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'AccessKey': BUNNY_STORAGE_API_KEY,
            'Content-Type': 'application/octet-stream'
        },
        body: buffer
    });

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Bunny Storage upload failed: HTTP ${response.status}`);
    }

    return `${BUNNY_CDN_BASE_URL}/${folder}/${filename}`;
}

async function processVideo(vidUrl) {
    console.log(`Commanding Bunny Stream to fetch video: ${vidUrl}`);

    let fetchTargetUrl = vidUrl;
    if (vidUrl.includes('ik.imagekit.io')) {
        fetchTargetUrl = vidUrl.includes('?') ? `${vidUrl}&tr=orig` : `${vidUrl}?tr=orig`;
        console.log(` -> Appended tr=orig to bypass ImageKit transformation limits: ${fetchTargetUrl}`);
    }

    const fetchUrl = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/fetch`;

    const fetchRes = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
            'AccessKey': BUNNY_STREAM_API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: fetchTargetUrl })
    });

    if (!fetchRes.ok) {
        throw new Error(`Bunny Stream Fetch failed: HTTP ${fetchRes.status}`);
    }

    const json = await fetchRes.json();
    if (!json.success || !json.id) {
        throw new Error(`Bunny Stream Fetch failed internally: ${JSON.stringify(json)}`);
    }
    
    // Wait for Bunny video processing to complete
    console.log(`Waiting for video processing to complete (ID: ${json.id})...`);
    let isReady = false;
    let attempts = 0;
    while (!isReady && attempts < 60) { // Max 10 minutes wait (60 * 10s)
        await new Promise(r => setTimeout(r, 10000));
        attempts++;
        try {
            const checkRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${json.id}`, {
                headers: {
                    'AccessKey': BUNNY_STREAM_API_KEY,
                    'Accept': 'application/json'
                }
            });
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.status === 4) { // 4 = Finished
                    isReady = true;
                } else if (checkData.status === 5) { // 5 = Failed
                    throw new Error(`Bunny Stream video processing failed.`);
                }
            }
        } catch (pollErr) {
            console.log(` -> Polling network drop (ignoring): ${pollErr.message}`);
        }
    }
    if (!isReady) throw new Error(`Video processing timed out after 10 minutes.`);

    return `https://${BUNNY_STREAM_CDN_HOSTNAME}/${json.id}/playlist.m3u8`;
}

(async () => {
    try {
        await generateLocalJwt();
    } catch (e) {
        console.error('Failed to start:', e.message);
        process.exit(1);
    }

    let page = 0;
    let hasMore = true;
    let productsToMigrate = [];

    console.log('Fetching products to identify migration targets...');
    while (hasMore) {
        const res = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=100`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });

        if (!res.ok) {
            console.error(`Failed to fetch products page ${page}. HTTP ${res.status}`);
            process.exit(1);
        }

        const data = await res.json();
        const products = data.content;

        if (!products || products.length === 0) {
            hasMore = false;
            break;
        }

        for (const p of products) {
            const hasLegacyImage = p.imageUrls && p.imageUrls.some(isLegacyUrl);
            const hasLegacyVideo = p.videoUrls && p.videoUrls.some(isLegacyUrl);

            if (hasLegacyImage || hasLegacyVideo) {
                productsToMigrate.push(p);
            }
        }

        hasMore = !data.last;
        page++;
    }

    console.log(`Found ${productsToMigrate.length} products requiring migration.`);

    for (let i = 0; i < productsToMigrate.length; i++) {
        const product = productsToMigrate[i];
        console.log(`\n[${i + 1}/${productsToMigrate.length}] Processing product: ${product.id}`);

        if (state.processed.includes(product.id)) {
            console.log(`Already processed. Skipping.`);
            continue;
        }

        try {
            const newImageUrls = [];
            const newVideoUrls = [];
            let updated = false;

            // Migrate Images
            if (product.imageUrls) {
                for (let j = 0; j < product.imageUrls.length; j++) {
                    const url = product.imageUrls[j];
                    if (isLegacyUrl(url)) {
                        console.log(`Migrating image: ${url}`);
                        if (!state.urlMap[product.id]) state.urlMap[product.id] = {};
                        if (state.urlMap[product.id][url]) {
                            console.log(` -> Reusing cached Bunny URL: ${state.urlMap[product.id][url]}`);
                            newImageUrls.push(state.urlMap[product.id][url]);
                            updated = true;
                            continue;
                        }

                        const { buffer, ext } = await downloadImage(url);
                        const filename = `${String(j + 1).padStart(2, '0')}.${ext}`;
                        const folderPath = `/kicks-aura/migrated/${product.id}/`;
                        
                        const bunnyUrl = await uploadToBunnyStorage(buffer, filename, folderPath);
                        state.urlMap[product.id][url] = bunnyUrl;
                        saveState();
                        newImageUrls.push(bunnyUrl);
                        updated = true;
                        console.log(` -> Uploaded to: ${bunnyUrl}`);
                    } else {
                        newImageUrls.push(url);
                    }
                }
            }

            // Migrate Videos
            if (product.videoUrls) {
                for (let j = 0; j < product.videoUrls.length; j++) {
                    const url = product.videoUrls[j];
                    if (isLegacyUrl(url)) {
                        console.log(`Migrating video: ${url}`);
                        if (!state.urlMap[product.id]) state.urlMap[product.id] = {};
                        if (state.urlMap[product.id][url]) {
                            console.log(` -> Reusing cached Bunny Video URL: ${state.urlMap[product.id][url]}`);
                            newVideoUrls.push(state.urlMap[product.id][url]);
                            updated = true;
                            continue;
                        }

                        const bunnyUrl = await processVideo(url);
                        state.urlMap[product.id][url] = bunnyUrl;
                        saveState();
                        newVideoUrls.push(bunnyUrl);
                        updated = true;
                        console.log(` -> Processed via Bunny Stream: ${bunnyUrl}`);
                    } else {
                        newVideoUrls.push(url);
                    }
                }
            }

            if (updated) {
                console.log(`Updating product in backend...`);
                const updatePayload = {
                    ...product,
                    imageUrls: newImageUrls,
                    videoUrls: newVideoUrls
                };

                const putRes = await fetch(`${API_URL}/api/v1/admin/products/${product.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ADMIN_TOKEN}`
                    },
                    body: JSON.stringify(updatePayload)
                });

                if (!putRes.ok) {
                    const errText = await putRes.text();
                    throw new Error(`Failed to PUT updated product: HTTP ${putRes.status} - ${errText}`);
                }
                console.log(`Product updated successfully!`);
            } else {
                console.log(`No legacy URLs were actually found during iteration.`);
            }

            state.processed.push(product.id);
            delete state.failed[product.id];
            saveState();

        } catch (err) {
            console.error(`Error migrating product ${product.id}: ${err.message}`);
            state.failed[product.id] = err.message;
            saveState();
        }
    }

    console.log(`\nMigration run completed.`);
    console.log(`Processed: ${state.processed.length}`);
    console.log(`Failed: ${Object.keys(state.failed).length}`);
})();
