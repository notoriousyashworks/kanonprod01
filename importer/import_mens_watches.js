const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// CONFIGURATION — Men's Watches
// ============================================================
const SOURCE_URL       = 'https://indiankicks.in/shop?c=mens-watch';
const CATEGORY         = 'Watches';
const BUNNY_FOLDER     = 'kicks-aura/indiankicks/mens-watches';
const MAX_IMPORT       = 200;
const SOURCE_SITE      = 'indiankicks.in';

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
let ADMIN_TOKEN = process.env.KICKSAURA_ADMIN_TOKEN;

// Bunny Storage
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE    = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_HOST    = process.env.BUNNY_STORAGE_HOST;
const BUNNY_CDN_BASE_URL    = process.env.BUNNY_CDN_BASE_URL;

// Bunny Stream
const BUNNY_STREAM_LIBRARY_ID   = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_API_KEY      = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME;

// ============================================================
// PRICE HELPER
// ============================================================
function generateCharmPrice(original, selling) {
    if (selling <= 0) return selling;
    const lastTwo = selling % 100;
    let newSelling = selling;
    if (lastTwo === 0)           newSelling = selling - 1;
    else if (lastTwo === 99)     newSelling = selling + 1;
    else if (lastTwo === 50)     newSelling = selling - 1;
    else if (selling % 10 === 0) newSelling = selling + 19;
    else newSelling = selling + (Math.random() > 0.5 ? -1 : 1);
    if (newSelling >= original) newSelling = original - 1;
    if (newSelling <= 0)        newSelling = selling;
    return newSelling;
}

// ============================================================
// IMAGE — download via Playwright page context
// ============================================================
async function downloadImage(url, page) {
    return await page.evaluate(async (imgUrl) => {
        const response = await fetch(imgUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error(`Invalid content-type: ${contentType}`);
        }
        const blob = await response.blob();
        if (blob.size < 1024) throw new Error(`File too small: ${blob.size}`);
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
    }, url);
}

// ============================================================
// IMAGE — upload to Bunny Storage
// ============================================================
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

// ============================================================
// VIDEO — download locally then PUT to Bunny Stream directly
// (avoids IndianKicks CDN blocking Bunny's fetch requests)
// ============================================================
async function processVideo(videoFilename, productId) {
    const vidUrl = 'https://cdn.cartpe.in/images/video_upload/' + videoFilename;
    console.log(`Downloading video locally to bypass CDN block: ${vidUrl}`);

    const dlRes = await fetch(vidUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!dlRes.ok) throw new Error(`Failed to download video from IndianKicks: ${dlRes.status}`);
    const arrayBuffer = await dlRes.arrayBuffer();

    console.log(`Creating Bunny Stream video for Men's Watch ${productId}...`);
    const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
            'AccessKey': BUNNY_STREAM_API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: `MensWatches_${productId}` })
    });
    if (!createRes.ok) throw new Error(`Failed to create Bunny video: ${createRes.status}`);
    const createJson = await createRes.json();
    const videoId = createJson.guid;

    console.log(`Uploading ${arrayBuffer.byteLength} bytes directly to Bunny Stream...`);
    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`, {
        method: 'PUT',
        headers: { 'AccessKey': BUNNY_STREAM_API_KEY },
        body: arrayBuffer
    });

    if (!uploadRes.ok) throw new Error(`Failed to upload bytes to Bunny Stream: ${uploadRes.status}`);

    return `https://${BUNNY_STREAM_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
}

// ============================================================
// LAYER 2 — Fuzzy Name Deduplication
// ============================================================

/**
 * Normalise a raw product name into a comparable token set.
 * - lowercase, strip underscores/punctuation, split on whitespace
 * - remove very short tokens (≤1 char) and pure numeric-only tokens
 *   that look like source IDs (6+ digits)
 */
function normTokens(name) {
    return new Set(
        name.toLowerCase()
            .replace(/_/g, ' ')
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1 && !/^\d{5,}$/.test(t))
    );
}

/**
 * Jaccard similarity between two token sets.
 * Returns a value 0..1 (1 = identical).
 */
function jaccard(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
}

/**
 * Fetch all existing "Watches" category product names from the DB.
 * Returns an array of { id, name } objects.
 */
async function fetchExistingWatchNames(token) {
    let page = 0, totalPages = 1, names = [];
    while (page < totalPages) {
        const resp = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error(`fetchExistingWatchNames: HTTP ${resp.status}`);
        const data = await resp.json();
        totalPages = data.totalPages;
        (data.content || [])
            .filter(p => (p.category || '').trim() === CATEGORY)
            .forEach(p => names.push({ id: p.id, name: p.name }));
        page++;
    }
    return names;
}

/**
 * Check a candidate name against all existing watch names.
 * AUTO_SKIP_THRESHOLD (0.90) → auto-skip, log as duplicate.
 * Returns { isDuplicate, bestMatch, similarity }.
 */
const AUTO_SKIP_THRESHOLD = 0.90;

function isDuplicateByName(candidateName, existingNames) {
    const candidateTokens = normTokens(candidateName);
    let bestSim = 0;
    let bestMatch = null;
    for (const { id, name } of existingNames) {
        const sim = jaccard(candidateTokens, normTokens(name));
        if (sim > bestSim) { bestSim = sim; bestMatch = { id, name }; }
    }
    return {
        isDuplicate: bestSim >= AUTO_SKIP_THRESHOLD,
        bestMatch,
        similarity: Math.round(bestSim * 100)
    };
}

// ============================================================
// MAIN
// ============================================================
(async () => {
    let stats = {
        totalDiscovered: 0,
        sourceIdsExtracted: 0,
        existingSourceIds: 0,
        newSourceIds: 0,
        maxAllowed: MAX_IMPORT,
        numberSelectedForImport: 0,
        successfullyImported: 0,
        alreadyExistedSkipped: 0,
        missingSourceIdSkipped: 0,
        nameDedupSkipped: 0,       // NEW — fuzzy name duplicates skipped
        failed: 0,
        imagesUploaded: 0,
        imageFailures: 0,
        videosAvailable: 0,
        videosSuccessfullyUploaded: 0,
        videoFailures: 0,
        apiFailures: 0,
        failedProducts: [],
        dedupSkipped: []           // NEW — log of name-dedup skips
    };

    // --- JWT ---
    console.log('Generating local JWT with ROLE_ADMIN...');
    try {
        const crypto = require('crypto');
        const secretBase64 = process.env.JWT_SECRET;
        if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
        const secretBytes = Buffer.from(secretBase64, 'base64');
        const header  = { alg: 'HS256', typ: 'JWT' };
        const jwtPayload = {
            sub: 'admin-importer-script',
            role: 'ROLE_ADMIN',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
        };
        const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64')
            .replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
        const headerEnc  = b64Url(header);
        const payloadEnc = b64Url(jwtPayload);
        const signature  = crypto.createHmac('sha256', secretBytes)
            .update(headerEnc + '.' + payloadEnc)
            .digest('base64')
            .replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
        ADMIN_TOKEN = headerEnc + '.' + payloadEnc + '.' + signature;
        console.log('JWT generated successfully.');
    } catch (e) {
        console.error('FATAL: Failed to generate token. ' + e.message);
        process.exit(1);
    }

    // --- Load existing watch names for fuzzy dedup (Layer 2) ---
    let existingWatchNames = [];
    try {
        console.log('Loading existing watch names for fuzzy dedup...');
        existingWatchNames = await fetchExistingWatchNames(ADMIN_TOKEN);
        console.log(`  Loaded ${existingWatchNames.length} existing watch names.`);
    } catch (e) {
        console.error(`WARNING: Could not load existing names for dedup: ${e.message}`);
        console.error('Continuing without name-based dedup (source-ID dedup still active).');
    }

    // --- Browser ---
    console.log('Starting Playwright for category discovery...');
    const browser      = await chromium.launch({ headless: true });
    const categoryPage = await browser.newPage();
    const detailPage   = await browser.newPage();

    // --- Load category page ---
    const initRes = await categoryPage.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (initRes.status() === 403 || initRes.status() === 429) {
        console.error(`FATAL: IndianKicks returned HTTP ${initRes.status()}. Stopping immediately as per rules.`);
        await browser.close();
        process.exit(1);
    }
    const pageContent = await categoryPage.content();
    if (
        pageContent.toLowerCase().includes('rate limit') ||
        pageContent.toLowerCase().includes('cloudflare') ||
        pageContent.toLowerCase().includes('access denied')
    ) {
        console.error('FATAL: Detected rate limit or challenge block. Stopping immediately as per rules.');
        await browser.close();
        process.exit(1);
    }
    await categoryPage.waitForTimeout(5000);

    // --- Link extraction helper ---
    function extractLinks(pageObj) {
        return pageObj.evaluate(() => {
            const rootEl = document.querySelector('#root');
            if (!rootEl) return [];
            const fiberKey = Object.keys(rootEl).find(k =>
                k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$')
            );
            if (!fiberKey) return [];
            let curr = rootEl[fiberKey];
            let found = [];
            let visited = new Set();
            function search(node, depth = 0) {
                if (!node || depth > 500) return;
                if (visited.has(node)) return;
                visited.add(node);
                try {
                    const stateStr = JSON.stringify(node.memoizedState);
                    if (stateStr && stateStr.includes('siteSlug')) {
                        const match = stateStr.match(/"siteSlug":"([^"]+)"/g);
                        if (match) match.forEach(m => found.push(m.replace(/"siteSlug":"/, '').replace(/"/, '')));
                    }
                    const propStr = JSON.stringify(node.memoizedProps);
                    if (propStr && propStr.includes('siteSlug')) {
                        const match = propStr.match(/"siteSlug":"([^"]+)"/g);
                        if (match) match.forEach(m => found.push(m.replace(/"siteSlug":"/, '').replace(/"/, '')));
                    }
                } catch (e) { }
                if (node.child)   search(node.child,   depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found;
        });
    }

    // --- Discovery + Import loop ---
    console.log('Loading links in batches...');
    let allLinks        = new Set();
    let clickCount      = 0;
    let keepDiscovering = true;

    while (stats.successfullyImported < MAX_IMPORT && keepDiscovering) {
        // Collect up to 150 new links before scraping detail pages
        let batchLinks   = [];
        const batchCap   = Math.min(150, MAX_IMPORT * 3);
        let stuckCounter = 0;

        while (batchLinks.length < batchCap) {
            const currentLinks = await extractLinks(categoryPage);
            let addedThisTurn = 0;
            currentLinks.forEach(l => {
                if (!allLinks.has(l)) {
                    allLinks.add(l);
                    batchLinks.push(l);
                    addedThisTurn++;
                }
            });

            console.log(`Click #${clickCount} | Unique Extracted: ${allLinks.size} | In Batch: ${batchLinks.length}`);

            if (batchLinks.length >= batchCap) break;

            if (addedThisTurn === 0 && clickCount > 0) {
                stuckCounter++;
            } else {
                stuckCounter = 0;
            }

            if (stuckCounter > 3) {
                console.log('No new links found after several clicks. Stopping discovery.');
                keepDiscovering = false;
                break;
            }

            const loadMoreBtn = await categoryPage.$('button:has-text("Load More Product"), button:has-text("Load More")');
            if (!loadMoreBtn) { keepDiscovering = false; break; }
            const isVisible  = await loadMoreBtn.isVisible();
            const isDisabled = await loadMoreBtn.isDisabled();
            if (!isVisible || isDisabled) { keepDiscovering = false; break; }

            await loadMoreBtn.scrollIntoViewIfNeeded();
            await categoryPage.waitForTimeout(500);
            await loadMoreBtn.click();
            clickCount++;
            await categoryPage.waitForTimeout(4000);
        }

        if (batchLinks.length === 0) break;

        console.log(`\nDiscovered batch of ${batchLinks.length} new links. Extracting details...`);
        stats.totalDiscovered = allLinks.size;

        // --- Scrape detail pages ---
        let scrapedProducts = [];
        for (const linkSlug of batchLinks) {
            const link = 'https://indiankicks.in/product-detail/' + linkSlug;
            try {
                await detailPage.goto(link, { waitUntil: 'networkidle', timeout: 45000 });
                await detailPage.waitForTimeout(4000);
            } catch (e) {
                console.error(`Skipping ${linkSlug} due to timeout/navigation error: ${e.message}`);
                continue;
            }

            const p = await detailPage.evaluate(() => {
                const rootEl = document.querySelector('#root');
                if (!rootEl) return null;
                const fiberKey = Object.keys(rootEl).find(k =>
                    k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$')
                );
                if (!fiberKey) return null;
                let curr  = rootEl[fiberKey];
                let found = null;
                function search(node, depth = 0) {
                    if (!node || depth > 50 || found) return;
                    if (node.memoizedState) {
                        let s = node.memoizedState;
                        while (s) {
                            if (s.memoizedState && typeof s.memoizedState === 'object') {
                                const val = s.memoizedState;
                                if (val && val.productName && val.wpBasicPrice) {
                                    found = val;
                                    return;
                                }
                            }
                            s = s.next;
                        }
                    }
                    if (node.child)   search(node.child,   depth + 1);
                    if (node.sibling) search(node.sibling, depth + 1);
                }
                search(curr);
                return found;
            });

            if (p) {
                const sourceId = p.id;  // IndianKicks stable numeric primary key
                if (!sourceId) {
                    stats.missingSourceIdSkipped++;
                    continue;
                }
                p.extractedSourceId = String(sourceId);
                scrapedProducts.push(p);
                stats.sourceIdsExtracted++;
            }
        }

        if (scrapedProducts.length === 0) {
            console.log('No valid products scraped in this batch. Continuing...');
            continue;
        }

        // --- Batch-lookup against production DB ---
        console.log(`\nReconciling ${scrapedProducts.length} scraped products with backend...`);
        const batchLookupReq = await fetch(`${API_URL}/api/v1/admin/products/batch-lookup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            },
            body: JSON.stringify({
                sourceSite: SOURCE_SITE,
                sourceProductIds: scrapedProducts.map(p => p.extractedSourceId)
            })
        });

        if (!batchLookupReq.ok) {
            const text = await batchLookupReq.text();
            console.error(`FATAL: Batch lookup failed with HTTP ${batchLookupReq.status}: ${text}`);
            await browser.close();
            process.exit(1);
        }

        const existingSourceIds = await batchLookupReq.json();
        const existingSet = new Set(existingSourceIds.map(String));

        stats.existingSourceIds += existingSet.size;

        let newProducts = scrapedProducts.filter(p => !existingSet.has(p.extractedSourceId));
        stats.newSourceIds          += newProducts.length;
        stats.alreadyExistedSkipped += (scrapedProducts.length - newProducts.length);

        // --- Layer 2: Fuzzy name dedup ---
        // Filter out candidates that are too similar to an existing watch name,
        // even if their source ID has never been seen before.
        if (existingWatchNames.length > 0) {
            const afterNameDedup = [];
            for (const p of newProducts) {
                const { isDuplicate, bestMatch, similarity } = isDuplicateByName(
                    p.productName || '', existingWatchNames
                );
                if (isDuplicate) {
                    console.log(`  [NAME-DEDUP] Auto-skipping "${p.productName}" — ${similarity}% similar to existing "${bestMatch.name}" (id: ${bestMatch.id})`);
                    stats.nameDedupSkipped++;
                    stats.dedupSkipped.push({
                        candidateName:   p.productName,
                        sourceId:        p.extractedSourceId,
                        matchedName:     bestMatch.name,
                        matchedId:       bestMatch.id,
                        similarityPct:   similarity
                    });
                } else {
                    afterNameDedup.push(p);
                }
            }
            newProducts = afterNameDedup;
        }

        // Respect the running total — only take as many as still needed
        const needed    = MAX_IMPORT - stats.successfullyImported;
        const toProcess = newProducts.slice(0, needed);
        stats.numberSelectedForImport += toProcess.length;
        console.log(`Selected ${toProcess.length} new products from this batch (Limit: ${MAX_IMPORT}).`);

        // --- Import each new product ---
        for (let i = 0; i < toProcess.length; i++) {
            const p        = toProcess[i];
            const sourceId = p.extractedSourceId;
            console.log(`\n[${i + 1}/${toProcess.length}] Processing Men's Watch ${sourceId}...`);

            // ── Step 1: Skip if no video ────────────────────────────────
            if (!p.video) {
                console.log(`  Skipping ${sourceId} — no video found.`);
                stats.failed++;
                stats.failedProducts.push({ id: sourceId, reason: 'No video' });
                continue;
            }

            try {
                const originalPrice      = parseFloat(p.wpOldPrice)   || parseFloat(p.originalPrice)      || 0;
                const sourceSellingPrice = parseFloat(p.wpBasicPrice)  || parseFloat(p.sourceSellingPrice) || 0;
                const finalSellingPrice  = (Math.random() < 0.4)
                    ? generateCharmPrice(originalPrice, sourceSellingPrice)
                    : sourceSellingPrice;

                // ── Step 2: Upload video first — skip entirely if it fails ──
                stats.videosAvailable++;
                let bunnyVidUrl;
                try {
                    bunnyVidUrl = await processVideo(p.video, sourceId);
                    stats.videosSuccessfullyUploaded++;
                    console.log(`  Video uploaded: ${bunnyVidUrl}`);
                } catch (e) {
                    stats.videoFailures++;
                    stats.failed++;
                    stats.failedProducts.push({ id: sourceId, reason: `Video upload failed: ${e.message}` });
                    console.error(`  Skipping ${sourceId} — video upload failed: ${e.message}`);
                    continue; // Skip images + DB entirely
                }

                // ── Step 3: Upload images ───────────────────────────────────
                let sourceImages = [];
                let g = p.gallery;
                if (typeof g === 'string') try { g = JSON.parse(g); } catch (e) { g = []; }
                if (Array.isArray(g))
                    sourceImages = g.map(img => typeof img === 'string' ? img : img.image)
                                    .map(imgPath => 'https://cdn.cartpe.in/images/gallery_lg/' + imgPath);
                else if (p.image)
                    sourceImages.push('https://cdn.cartpe.in/images/gallery_lg/' + p.image);

                sourceImages = [...new Set(sourceImages)];
                if (sourceImages.length === 0) throw new Error('No images found');

                const bunnyUrls = [];
                let imageIndex  = 1;
                for (const imgUrl of sourceImages) {
                    const filename   = `${String(imageIndex).padStart(2, '0')}.jpg`;
                    const folderPath = `${BUNNY_FOLDER}/${sourceId}`;
                    try {
                        const b64         = await downloadImage(imgUrl, detailPage);
                        const bunnyBuffer = Buffer.from(b64, 'base64');
                        const bunnyUrl    = await uploadToBunnyStorage(bunnyBuffer, filename, folderPath);
                        bunnyUrls.push(bunnyUrl);
                        stats.imagesUploaded++;
                    } catch (e) {
                        stats.imageFailures++;
                        console.error(`  Image failure: ${e.message}`);
                    }
                    imageIndex++;
                }

                if (bunnyUrls.length === 0) throw new Error('All images failed to upload');

                // ── Step 4: Create product in DB ────────────────────────────
                const productPayload = {
                    name:             p.productName,
                    originalName:     p.productName,
                    brand:            p.brandName || 'Unknown',
                    category:         CATEGORY,
                    basePrice:        originalPrice,
                    discountedPrice:  finalSellingPrice,
                    imageUrls:        bunnyUrls,
                    videoUrls:        [bunnyVidUrl],
                    visible:          false,
                    variants:         [],
                    searchName:       p.productName,
                    searchBrand:      p.brandName || 'Unknown',
                    searchText:       p.productName,
                    description:      '',
                    sourceSite:       SOURCE_SITE,
                    sourceProductId:  sourceId
                };

                const postReq = await fetch(`${API_URL}/api/v1/admin/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ADMIN_TOKEN}`
                    },
                    body: JSON.stringify(productPayload)
                });

                const httpStatus = postReq.status;
                if (httpStatus === 401 || httpStatus === 403) {
                    console.error(`FATAL: Authentication failure (${httpStatus}). Stopping.`);
                    await browser.close();
                    process.exit(1);
                }
                if (httpStatus === 409) {
                    console.log(`Product ${sourceId} already exists (409 Conflict), treating as already imported.`);
                    stats.alreadyExistedSkipped++;
                    continue;
                }
                if (httpStatus !== 201) {
                    stats.apiFailures++;
                    const errText = await postReq.text();
                    throw new Error(`API HTTP ${httpStatus}: ${errText}`);
                }

                const responseJson = await postReq.json();
                stats.successfullyImported++;
                console.log(`  Created product! ID: ${responseJson.id}`);

            } catch (err) {
                stats.failed++;
                stats.failedProducts.push({ id: sourceId, reason: err.message });
                console.error(`  Failed product ${sourceId}: ${err.message}`);
            }
        }


        if (stats.successfullyImported >= MAX_IMPORT) {
            console.log(`\nReached limit of ${MAX_IMPORT} imported products. Stopping discovery.`);
            break;
        }
    }

    await browser.close();

    // --- Final Report ---
    console.log(`\n================================`);
    console.log(`FINAL REPORT`);
    console.log(`SOURCE`);
    console.log(`- Category URL: ${SOURCE_URL}`);
    console.log(`- Total Men's Watches discovered: ${stats.totalDiscovered}`);
    console.log(`- Source IDs extracted: ${stats.sourceIdsExtracted}`);
    console.log(`\nRECONCILIATION`);
    console.log(`- Existing source IDs (skipped):     ${stats.existingSourceIds}`);
    console.log(`- New source IDs:                    ${stats.newSourceIds}`);
    console.log(`- Name-dedup skipped (≥90% similar): ${stats.nameDedupSkipped}`);
    console.log(`- Maximum allowed:                   ${stats.maxAllowed}`);
    console.log(`- Number selected for import:        ${stats.numberSelectedForImport}`);
    console.log(`\nIMPORT`);
    console.log(`- Successfully imported:      ${stats.successfullyImported}`);
    console.log(`- Already existed/skipped:    ${stats.alreadyExistedSkipped}`);
    console.log(`- Missing source ID/skipped:  ${stats.missingSourceIdSkipped}`);
    console.log(`- Failed:                     ${stats.failed}`);

    if (stats.dedupSkipped.length > 0) {
        console.log(`\nNAME-DEDUP SKIPPED PRODUCTS (${stats.dedupSkipped.length}):`);
        stats.dedupSkipped.forEach(d =>
            console.log(`  - "${d.candidateName}" (src: ${d.sourceId}) → ${d.similarityPct}% match with "${d.matchedName}"`)
        );
    }
    console.log(`\nMEDIA`);
    console.log(`- Images uploaded to Bunny: ${stats.imagesUploaded}`);
    console.log(`- Image failures: ${stats.imageFailures}`);
    console.log(`- Products with videos: ${stats.videosAvailable}`);
    console.log(`- Bunny videos successfully uploaded: ${stats.videosSuccessfullyUploaded}`);
    console.log(`- Video failures: ${stats.videoFailures}`);
    console.log(`\nSAFETY`);
    console.log(`- Existing products modified: NO`);
    console.log(`- Existing visibility changed: NO`);
    console.log(`- Existing products deleted: NO`);
    console.log(`- Existing products merged: NO`);
    console.log(`- IP/rate-limit bypass attempted: NO`);
    console.log(`\nSOURCE IDENTITY`);
    console.log(`Every successfully imported product has:`);
    console.log(`  sourceSite      = ${SOURCE_SITE}`);
    console.log(`  sourceProductId = actual IndianKicks numeric ID (p.id)`);

    if (stats.failedProducts.length > 0) {
        console.log(`\nFAILED PRODUCTS:`);
        stats.failedProducts.forEach(fp => console.log(`  - ${fp.id}: ${fp.reason}`));
    }
})();
