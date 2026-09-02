const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ImageKit = require('imagekit');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { normalizeProductName } = require('./src/content/productNameNormalizer');
const contentGenerator = require('./src/content/contentGenerator');

const DB_PATH = path.join(__dirname, 'db.json');
const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
const ADMIN_TOKEN = process.env.KICKSAURA_ADMIN_TOKEN;

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ imported: {} }, null, 2));
}

let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
if (!db.imported) db.imported = {};

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

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

async function uploadToImageKit(base64Data, filename, folder) {
    return new Promise((resolve, reject) => {
        imagekit.upload({
            file: base64Data, 
            fileName: filename,
            folder: folder
        }, function(error, result) {
            if (error) reject(error);
            else resolve(result.url);
        });
    });
}

async function processVideo(videoFilename, productId) {
    const vidUrl = 'https://cdn.cartpe.in/images/video_upload/' + videoFilename;
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    
    const inputPath = path.join(tmpDir, `${productId}_in.mp4`);
    const outputPath = path.join(tmpDir, `${productId}_out.mp4`);

    console.log(`Downloading video: ${vidUrl}`);
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(vidUrl);
    if (!res.ok) throw new Error(`Video download failed: HTTP ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (contentType && (contentType.includes('text/') || contentType.includes('xml') || contentType.includes('html'))) {
        throw new Error(`Invalid video content-type: ${contentType}`);
    }
    
    const buffer = await res.buffer();
    if (buffer.length < 5000) throw new Error('Video too small, likely an error response');
    fs.writeFileSync(inputPath, buffer);

    console.log(`Converting video with ffmpeg...`);
    execSync(`ffmpeg -y -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`, { stdio: 'pipe' });

    const outBuffer = fs.readFileSync(outputPath);
    console.log(`Uploading converted video to ImageKit...`);
    const base64Vid = outBuffer.toString('base64');
    const folderPath = `/kicks-aura/indiankicks/ladies-sunglasses/${productId}/`;
    
    const ikUrl = await uploadToImageKit(base64Vid, 'video.mp4', folderPath);
    
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    
    return ikUrl;
}

(async () => {
    let stats = {
        totalDiscovered: 0,
        alreadyImported: 0,
        newSelected: 0,
        successfullyImported: 0,
        failed: 0,
        imagesUploaded: 0,
        imageFailures: 0,
        videosAvailable: 0,
        videosSuccessfullyUploaded: 0,
        videoFailures: 0,
        duplicateSkips: 0,
        apiFailures: 0,
        failedProducts: []
    };

    console.log('Starting Playwright for category discovery...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://indiankicks.in/shop?c=sunglasses-eye-wear-women', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('Loading all products...');
    let noNewProducts = 0;
    while(noNewProducts < 3) {
        const loadMore = await page.$('text="Load More Product"');
        if (loadMore) {
            const before = await page.evaluate(() => document.querySelectorAll('.product-item').length);
            await loadMore.click();
            await page.waitForTimeout(2000);
            const after = await page.evaluate(() => document.querySelectorAll('.product-item').length);
            if (before === after) noNewProducts++;
            else noNewProducts = 0;
        } else {
            break;
        }
    }
    
    console.log('Extracting product data from React state...');
    const allProducts = await page.evaluate(() => {
        const rootEl = document.querySelector('#root');
        if (!rootEl) return [];
        const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
        if (!fiberKey) return [];
        let curr = rootEl[fiberKey];
        let prods = [];
        function search(node, depth = 0) {
          if (!node || depth > 50) return;
          if (node.memoizedState) {
            let s = node.memoizedState;
            while (s) {
              if (s.memoizedState && typeof s.memoizedState === 'object') {
                const val = s.memoizedState;
                if (val && Array.isArray(val) && val.length > 0 && val[0].productName && val[0].wpBasicPrice) {
                  prods = val;
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
        return prods;
    });

    stats.totalDiscovered = allProducts.length;
    console.log(`Discovered ${stats.totalDiscovered} products.`);

    let eligibleProducts = [];
    for (const p of allProducts) {
        if (db.imported[p.productId] && db.imported[p.productId].status === 'CREATED') {
            stats.alreadyImported++;
            stats.duplicateSkips++;
            continue;
        }
        const selling = parseFloat(p.wpBasicPrice) || parseFloat(p.sourceSellingPrice) || 0;
        const original = parseFloat(p.wpOldPrice) || parseFloat(p.originalPrice) || 0;
        if (selling <= 0 || original <= 0 || selling > original) continue;
        
        eligibleProducts.push(p);
    }
    
    const toProcess = eligibleProducts.slice(0, 100);
    stats.newSelected = toProcess.length;
    console.log(`Selected ${stats.newSelected} new products for import.`);

    for (let i = 0; i < toProcess.length; i++) {
        const p = toProcess[i];
        console.log(`\n[${i+1}/${toProcess.length}] Processing ${p.productId}...`);
        
        if (!db.imported[p.productId]) {
            db.imported[p.productId] = { media: {} };
            saveDb();
        }
        const state = db.imported[p.productId];

        try {
            const originalPrice = parseFloat(p.wpOldPrice) || parseFloat(p.originalPrice) || 0;
            const sourceSellingPrice = parseFloat(p.wpBasicPrice) || parseFloat(p.sourceSellingPrice) || 0;
            const finalSellingPrice = (Math.random() < 0.4) ? generateCharmPrice(originalPrice, sourceSellingPrice) : sourceSellingPrice;

            const cleanName = normalizeProductName(p.productName);

            let sourceImages = [];
            let g = p.gallery;
            if (typeof g === 'string') try { g = JSON.parse(g); } catch(e){ g=[]; }
            if (Array.isArray(g)) sourceImages = g.map(img => typeof img === 'string' ? img : img.image).map(path => 'https://cdn.cartpe.in/images/gallery_lg/' + path);
            else if (p.image) sourceImages.push('https://cdn.cartpe.in/images/gallery_lg/' + p.image);
            
            sourceImages = [...new Set(sourceImages)];
            if (sourceImages.length === 0) throw new Error('No images found');

            const ikUrls = [];
            let imageIndex = 1;
            for (const imgUrl of sourceImages) {
                const ikFilename = `${String(imageIndex).padStart(2, '0')}.jpg`;
                const folderPath = `/kicks-aura/indiankicks/ladies-sunglasses/${p.productId}/`;
                const stateKey = `img_${imageIndex}`;
                
                if (state.media[stateKey]) {
                    ikUrls.push(state.media[stateKey]);
                } else {
                    try {
                        const b64 = await downloadImage(imgUrl, page);
                        const ikUrl = await uploadToImageKit(b64, ikFilename, folderPath);
                        ikUrls.push(ikUrl);
                        state.media[stateKey] = ikUrl;
                        saveDb();
                        stats.imagesUploaded++;
                    } catch(e) {
                        stats.imageFailures++;
                        console.error(`Image failure: ${e.message}`);
                    }
                }
                imageIndex++;
            }

            if (ikUrls.length === 0) throw new Error('All images failed to upload');

            const videoUrls = [];
            if (p.video) {
                stats.videosAvailable++;
                if (state.media['video']) {
                    videoUrls.push(state.media['video']);
                } else {
                    try {
                        const ikVidUrl = await processVideo(p.video, p.productId);
                        videoUrls.push(ikVidUrl);
                        state.media['video'] = ikVidUrl;
                        saveDb();
                        stats.videosSuccessfullyUploaded++;
                    } catch(e) {
                        stats.videoFailures++;
                        console.error(`Video failure: ${e.message}`);
                    }
                }
            }

            const content = contentGenerator.generateProductContent({
                productName: cleanName,
                category: "Ladies Sunglasses",
                brand: p.brandName || "Unknown"
            });

            const payload = {
                name: cleanName,
                originalName: p.productName,
                brand: content.searchBrand || "Unknown",
                category: "Ladies Sunglasses",
                basePrice: originalPrice,
                discountedPrice: finalSellingPrice,
                imageUrls: ikUrls,
                videoUrls: videoUrls,
                visible: false,
                variants: [],
                searchName: content.searchName,
                searchBrand: content.searchBrand,
                searchText: content.searchText,
                description: content.description
            };

            const postReq = await (await import('node-fetch')).default(`${API_URL}/api/v1/admin/products`, {
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

            if (status !== 201) {
                stats.apiFailures++;
                const errText = await postReq.text();
                throw new Error(`API HTTP ${status}: ${errText}`);
            }

            const responseJson = await postReq.json();
            state.status = 'CREATED';
            state.kicksAuraId = responseJson.id;
            state.name = cleanName;
            state.importedAt = new Date().toISOString();
            saveDb();
            stats.successfullyImported++;
            console.log(`Created product! ID: ${responseJson.id}`);

        } catch (err) {
            stats.failed++;
            stats.failedProducts.push({ id: p.productId, reason: err.message });
            state.status = 'FAILED';
            state.reason = err.message;
            saveDb();
            console.error(`Failed product ${p.productId}: ${err.message}`);
        }
    }

    await browser.close();

    console.log(`\n================================`);
    console.log(`FINAL REPORT`);
    console.log(`Total Discovered: ${stats.totalDiscovered}`);
    console.log(`Already Imported (Skipped): ${stats.alreadyImported}`);
    console.log(`New Selected: ${stats.newSelected}`);
    console.log(`Successfully Imported: ${stats.successfullyImported}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Images Uploaded: ${stats.imagesUploaded}`);
    console.log(`Image Failures: ${stats.imageFailures}`);
    console.log(`Videos Available: ${stats.videosAvailable}`);
    console.log(`Videos Converted/Uploaded: ${stats.videosSuccessfullyUploaded}`);
    console.log(`Video Failures: ${stats.videoFailures}`);
    console.log(`Duplicate Skips: ${stats.duplicateSkips}`);
    console.log(`API Failures: ${stats.apiFailures}`);
    
    if (stats.failedProducts.length > 0) {
        console.log(`\nFailed Products Details:`);
        stats.failedProducts.forEach(fp => console.log(`- ${fp.id}: ${fp.reason}`));
    }
})();
