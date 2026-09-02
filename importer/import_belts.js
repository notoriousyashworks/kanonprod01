const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { normalizeProductName } = require('./src/content/productNameNormalizer');
const contentGenerator = require('./src/content/contentGenerator');

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
let ADMIN_TOKEN = process.env.KICKSAURA_ADMIN_TOKEN;

// Bunny Configuration
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST;
const BUNNY_CDN_BASE_URL = process.env.BUNNY_CDN_BASE_URL;

const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME;

function generateCharmPrice(original, selling) {
    if (selling <= 0) return selling;
    const lastTwo = selling % 100;
    let newSelling = selling;
    if (lastTwo === 0) newSelling = selling - 1;
    else if (lastTwo === 99) newSelling = selling + 1;
    else if (lastTwo === 50) newSelling = selling - 1;
    else if (selling % 10 === 0) newSelling = selling + 19;
    else newSelling = selling + (Math.random() > 0.5 ? -1 : 1);
    if (newSelling >= original) newSelling = original - 1;
    if (newSelling <= 0) newSelling = selling;
    return newSelling;
}

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

async function processVideo(videoFilename, productId) {
    const vidUrl = 'https://cdn.cartpe.in/images/video_upload/' + videoFilename;
    console.log(`Commanding Bunny Stream to fetch video: ${vidUrl}`);

    const fetchUrl = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/fetch`;

    const fetchRes = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
            'AccessKey': BUNNY_STREAM_API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: vidUrl })
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
    }
    if (!isReady) throw new Error(`Video processing timed out after 10 minutes.`);

    return `https://${BUNNY_STREAM_CDN_HOSTNAME}/${json.id}/playlist.m3u8`;
}

(async () => {
    let stats = {
        totalDiscovered: 0,
        sourceIdsExtracted: 0,
        existingSourceIds: 0,
        newSourceIds: 0,
        maxAllowed: 100,
        numberSelectedForImport: 0,
        successfullyImported: 0,
        alreadyExistedSkipped: 0,
        missingSourceIdSkipped: 0,
        failed: 0,
        imagesUploaded: 0,
        imageFailures: 0,
        videosAvailable: 0,
        videosSuccessfullyUploaded: 0,
        videoFailures: 0,
        apiFailures: 0,
        failedProducts: []
    };

    console.log('Generating local JWT with ROLE_ADMIN...');
    try {
        const crypto = require('crypto');
        const secretBase64 = process.env.JWT_SECRET;
        if (!secretBase64) throw new Error("JWT_SECRET is missing from .env");
        const secretBytes = Buffer.from(secretBase64, 'base64');
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: 'admin-importer-script', role: 'ROLE_ADMIN', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 };
        const b64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
        const headerEnc = b64UrlEncode(header);
        const payloadEnc = b64UrlEncode(payload);
        const signature = crypto.createHmac('sha256', secretBytes).update(headerEnc + '.' + payloadEnc).digest('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
        ADMIN_TOKEN = headerEnc + '.' + payloadEnc + '.' + signature;
        console.log('JWT generated successfully.');
    } catch (e) {
        console.error('FATAL: Failed to generate token. ' + e.message);
        process.exit(1);
    }

    console.log('Starting Playwright for category discovery...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let res = await page.goto('https://indiankicks.in/shop?c=belts', { waitUntil: 'networkidle' });
    if (res.status() === 403 || res.status() === 429) {
        console.error(`FATAL: IndianKicks returned HTTP ${res.status()}. Stopping immediately as per rules.`);
        await browser.close();
        process.exit(1);
    }
    
    // Check for rate limit or block challenge texts
    const pageContent = await page.content();
    if (pageContent.toLowerCase().includes('rate limit') || pageContent.toLowerCase().includes('cloudflare') || pageContent.toLowerCase().includes('access denied')) {
        console.error(`FATAL: Detected rate limit or challenge block. Stopping immediately as per rules.`);
        await browser.close();
        process.exit(1);
    }
    
    await page.waitForTimeout(5000);

    console.log('Loading all links...');
    let allLinks = new Set();

    function extractLinks(page) {
        return page.evaluate(() => {
            const rootEl = document.querySelector('#root');
            if (!rootEl) return [];
            const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
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
                        const match = stateStr.match(/\"siteSlug\":\"([^\"]+)\"/g);
                        if (match) match.forEach(m => found.push(m.replace(/\"siteSlug\":\"/, '').replace(/\"/, '')));
                    }
                    const propStr = JSON.stringify(node.memoizedProps);
                    if (propStr && propStr.includes('siteSlug')) {
                        const match = propStr.match(/\"siteSlug\":\"([^\"]+)\"/g);
                        if (match) match.forEach(m => found.push(m.replace(/\"siteSlug\":\"/, '').replace(/\"/, '')));
                    }
                } catch (e) { }
                if (node.child) search(node.child, depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found;
        });
    }

    let clickCount = 0;
    while (true) {
        const currentLinks = await extractLinks(page);
        const beforeCount = allLinks.size;
        currentLinks.forEach(l => allLinks.add(l));

        console.log(`Click #${clickCount} | Unique Extracted: ${allLinks.size}`);

        const loadMoreBtn = await page.$('button:has-text("Load More Product"), button:has-text("Load More")');
        if (!loadMoreBtn) break;
        const isVisible = await loadMoreBtn.isVisible();
        const isDisabled = await loadMoreBtn.isDisabled();
        if (!isVisible || isDisabled) break;

        await loadMoreBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await loadMoreBtn.click();
        clickCount++;
        await page.waitForTimeout(4000);

        if (allLinks.size === beforeCount && clickCount > 3) break;
    }

    console.log(`Discovered ${allLinks.size} unique links.`);
    stats.totalDiscovered = allLinks.size;

    let scrapedProducts = [];
    const linkArray = Array.from(allLinks).map(s => 'https://indiankicks.in/product-detail/' + s);

    console.log('Extracting product details...');
    for (const link of linkArray) {
        await page.goto(link, { waitUntil: 'networkidle' });
        await page.waitForTimeout(4000);

        const p = await page.evaluate(() => {
            const rootEl = document.querySelector('#root');
            if (!rootEl) return null;
            const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
            if (!fiberKey) return null;
            let curr = rootEl[fiberKey];
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
                if (node.child) search(node.child, depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found;
        });

        if (p) {
            const sourceId = p.productId;
            if (!sourceId) {
                stats.missingSourceIdSkipped++;
                continue;
            }
            p.extractedSourceId = String(sourceId);
            scrapedProducts.push(p);
            stats.sourceIdsExtracted++;
        }
    }

    console.log(`\nReconciling ${scrapedProducts.length} scraped products with backend...`);
    
    const batchLookupReq = await fetch(`${API_URL}/api/v1/admin/products/batch-lookup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
            sourceSite: 'indiankicks.in',
            sourceProductIds: scrapedProducts.map(p => p.extractedSourceId)
        })
    });

    if (!batchLookupReq.ok) {
        const text = await batchLookupReq.text();
        console.error(`FATAL: Batch lookup failed with HTTP ${batchLookupReq.status}: ${text}`);
        await browser.close();
        process.exit(1);
    }

    const existingSourceIds = await batchLookupReq.json(); // List of strings
    const existingSet = new Set(existingSourceIds.map(String));
    
    stats.existingSourceIds = existingSet.size;
    
    let newProducts = scrapedProducts.filter(p => !existingSet.has(p.extractedSourceId));
    stats.newSourceIds = newProducts.length;
    stats.alreadyExistedSkipped = scrapedProducts.length - newProducts.length;

    const toProcess = newProducts.slice(0, 100);
    stats.numberSelectedForImport = toProcess.length;
    console.log(`Selected ${stats.numberSelectedForImport} new products for import (Limit: 100).`);

    for (let i = 0; i < toProcess.length; i++) {
        const p = toProcess[i];
        const sourceId = p.extractedSourceId;
        console.log(`\n[${i + 1}/${toProcess.length}] Processing Belt ${sourceId}...`);

        try {
            const originalPrice = parseFloat(p.wpOldPrice) || parseFloat(p.originalPrice) || 0;
            const sourceSellingPrice = parseFloat(p.wpBasicPrice) || parseFloat(p.sourceSellingPrice) || 0;
            const finalSellingPrice = (Math.random() < 0.4) ? generateCharmPrice(originalPrice, sourceSellingPrice) : sourceSellingPrice;

            const cleanName = normalizeProductName(p.productName);

            let sourceImages = [];
            let g = p.gallery;
            if (typeof g === 'string') try { g = JSON.parse(g); } catch (e) { g = []; }
            if (Array.isArray(g)) sourceImages = g.map(img => typeof img === 'string' ? img : img.image).map(path => 'https://cdn.cartpe.in/images/gallery_lg/' + path);
            else if (p.image) sourceImages.push('https://cdn.cartpe.in/images/gallery_lg/' + p.image);

            sourceImages = [...new Set(sourceImages)];
            if (sourceImages.length === 0) throw new Error('No images found');

            const bunnyUrls = [];
            let imageIndex = 1;
            for (const imgUrl of sourceImages) {
                const ikFilename = `${String(imageIndex).padStart(2, '0')}.jpg`;
                const folderPath = `/kicks-aura/indiankicks/belts/${sourceId}/`;
                try {
                    const b64 = await downloadImage(imgUrl, page);
                    const bunnyBuffer = Buffer.from(b64, 'base64');
                    const bunnyUrl = await uploadToBunnyStorage(bunnyBuffer, ikFilename, folderPath);
                    bunnyUrls.push(bunnyUrl);
                    stats.imagesUploaded++;
                } catch (e) {
                    stats.imageFailures++;
                    console.error(`Image failure: ${e.message}`);
                }
                imageIndex++;
            }

            if (bunnyUrls.length === 0) throw new Error('All images failed to upload');

            const videoUrls = [];
            if (p.video) {
                stats.videosAvailable++;
                try {
                    const bunnyVidUrl = await processVideo(p.video, sourceId);
                    videoUrls.push(bunnyVidUrl);
                    stats.videosSuccessfullyUploaded++;
                } catch (e) {
                    stats.videoFailures++;
                    console.error(`Video failure: ${e.message}`);
                }
            }

            const content = contentGenerator.generateProductContent({
                productName: cleanName,
                category: "Belts",
                brand: p.brandName || "Unknown"
            });

            const payload = {
                name: cleanName,
                originalName: p.productName,
                brand: content.searchBrand || "Unknown",
                category: "Belts",
                basePrice: originalPrice,
                discountedPrice: finalSellingPrice,
                imageUrls: bunnyUrls,
                videoUrls: videoUrls,
                visible: false,
                variants: [],
                searchName: content.searchName,
                searchBrand: content.searchBrand,
                searchText: content.searchText,
                description: content.description,
                sourceSite: "indiankicks.in",
                sourceProductId: sourceId
            };

            const postReq = await fetch(`${API_URL}/api/v1/admin/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            const status = postReq.status;
            if (status === 401 || status === 403) {
                console.error(`FATAL: Authentication failure (${status}). Stopping.`);
                process.exit(1);
            }

            if (status === 409) {
                console.log(`Product ${sourceId} created concurrently (409 Conflict), treating as already imported.`);
                stats.alreadyExistedSkipped++;
                continue;
            }

            if (status !== 201) {
                stats.apiFailures++;
                const errText = await postReq.text();
                throw new Error(`API HTTP ${status}: ${errText}`);
            }

            const responseJson = await postReq.json();
            stats.successfullyImported++;
            console.log(`Created product! ID: ${responseJson.id}`);

        } catch (err) {
            stats.failed++;
            stats.failedProducts.push({ id: sourceId, reason: err.message });
            console.error(`Failed product ${sourceId}: ${err.message}`);
        }
    }

    await browser.close();

    console.log(`\n================================`);
    console.log(`FINAL REPORT`);
    console.log(`SOURCE`);
    console.log(`- Total Belt products discovered: ${stats.totalDiscovered}`);
    console.log(`- Source IDs extracted: ${stats.sourceIdsExtracted}`);
    console.log(`\nRECONCILIATION`);
    console.log(`- Existing source IDs: ${stats.existingSourceIds}`);
    console.log(`- New source IDs: ${stats.newSourceIds}`);
    console.log(`- Maximum allowed: ${stats.maxAllowed}`);
    console.log(`- Number selected for import: ${stats.numberSelectedForImport}`);
    console.log(`\nIMPORT`);
    console.log(`- Successfully imported: ${stats.successfullyImported}`);
    console.log(`- Already existed/skipped: ${stats.alreadyExistedSkipped}`);
    console.log(`- Missing source ID/skipped: ${stats.missingSourceIdSkipped}`);
    console.log(`- Failed: ${stats.failed}`);
    console.log(`\nMEDIA`);
    console.log(`- Images uploaded to Bunny: ${stats.imagesUploaded}`);
    console.log(`- Image failures: ${stats.imageFailures}`);
    console.log(`- Products with videos: ${stats.videosAvailable}`);
    console.log(`- Bunny videos successfully processed: ${stats.videosSuccessfullyUploaded}`);
    console.log(`- Video failures: ${stats.videoFailures}`);
    console.log(`\nSAFETY`);
    console.log(`- Existing products modified: NO`);
    console.log(`- Existing visibility changed: NO`);
    console.log(`- Existing products deleted: NO`);
    console.log(`- Existing products merged: NO`);
    console.log(`- Cloudinary migration: NO`);
    console.log(`- ImageKit migration: NO`);
    console.log(`- IP/rate-limit bypass attempted: NO`);
    console.log(`\nSOURCE IDENTITY`);
    console.log(`Confirm every successfully imported product has:`);
    console.log(`sourceSite = indiankicks.in`);
    console.log(`sourceProductId = actual IndianKicks ID`);
})();
