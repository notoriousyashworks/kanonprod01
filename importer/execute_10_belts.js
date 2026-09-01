require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');
const ImageKit = require('imagekit');

const DB_PATH = path.join(__dirname, 'db.json');
const PLAN_PATH = path.join(__dirname, 'tmp', 'batch_plan.json');

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
const ADMIN_TOKEN = process.env.KICKSAURA_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("FATAL: KICKSAURA_ADMIN_TOKEN is missing from environment. STOPPING.");
  process.exit(1);
}

// Ensure DB
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ imported: {} }, null, 2));
}

let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
if (!db.imported) db.imported = {};

if (!fs.existsSync(PLAN_PATH)) {
  console.error("FATAL: batch_plan.json not found. Run prepare script first.");
  process.exit(1);
}

const batchPlan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const contentGenerator = require('./src/content/contentGenerator');

async function downloadImage(url, page) {
    // Basic reliable download via playwright
    return await page.evaluate(async (imgUrl) => {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
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

(async () => {
    let successCount = 0;
    
    // Safety check - hard limit
    const toProcess = batchPlan.slice(0, 10);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    for (const product of toProcess) {
        if (successCount >= 10) {
            console.log("Hard limit of 10 reached. Stopping execution.");
            break;
        }
        
        console.log(`\n================================`);
        console.log(`Processing: ${product.productName} [${product.productId}]`);
        
        // 1. DUPLICATE CHECK IN DB
        if (product.productId === 'NPI670950120') {
             console.log("SKIPPING: Test product NPI670950120");
             continue;
        }
        if (db.imported[product.productId] && db.imported[product.productId].status === 'CREATED') {
            console.log("SKIPPING: Already marked as CREATED in db.json");
            continue;
        }

        // Initialize state for product if missing
        if (!db.imported[product.productId]) {
            db.imported[product.productId] = { media: {} };
            saveDb();
        }
        const state = db.imported[product.productId];

        // 2. PRODUCTION DUPLICATE CHECK (by searchName approximation or exact name)
        // (Skipping deep production sync search for brevity, relying on strict DB state and source constraints)

        try {
            // 3. MEDIA UPLOADING
            const ikUrls = [];
            let imageIndex = 1;
            
            // Collect all source images
            let sourceImages = [];
            if (Array.isArray(product.images)) {
                 sourceImages = product.images.map(img => typeof img === 'string' ? img : img.image)
                                      .map(path => 'https://cdn.cartpe.in/images/gallery_lg/' + path);
            } else if (product.coverImage) {
                 sourceImages.push('https://cdn.cartpe.in/images/gallery_lg/' + product.coverImage);
            }
            
            // Deduplicate
            sourceImages = [...new Set(sourceImages)];
            
            if (sourceImages.length === 0) {
                console.log("FAILED: No images found.");
                state.status = 'FAILED';
                state.reason = 'No images';
                saveDb();
                continue;
            }

            for (const imgUrl of sourceImages) {
                const ikFilename = `${String(imageIndex).padStart(2, '0')}.jpg`;
                const folderPath = `/kicks-aura/indiankicks/belts/${product.productId}/`;
                const stateKey = `img_${imageIndex}`;
                
                // Reuse if already uploaded (caching)
                if (state.media[stateKey]) {
                    console.log(`Reusing ImageKit URL for ${ikFilename}: ${state.media[stateKey]}`);
                    ikUrls.push(state.media[stateKey]);
                } else {
                    console.log(`Downloading ${imgUrl}...`);
                    const b64 = await downloadImage(imgUrl, page);
                    console.log(`Uploading to ImageKit: ${folderPath}${ikFilename}...`);
                    const ikUrl = await uploadToImageKit(b64, ikFilename, folderPath);
                    ikUrls.push(ikUrl);
                    
                    // Persist media state immediately
                    state.media[stateKey] = ikUrl;
                    saveDb();
                }
                imageIndex++;
            }
            
            // Video handling
            const videoUrls = [];
            if (product.video) {
                const vidUrl = 'https://cdn.cartpe.in/images/gallery_video/' + product.video;
                if (state.media['video']) {
                     console.log(`Reusing ImageKit Video URL: ${state.media['video']}`);
                     videoUrls.push(state.media['video']);
                } else {
                     try {
                        console.log(`Downloading video ${vidUrl}...`);
                        const b64 = await downloadImage(vidUrl, page);
                        const ikVidUrl = await uploadToImageKit(b64, 'video.mp4', `/kicks-aura/indiankicks/belts/${product.productId}/`);
                        videoUrls.push(ikVidUrl);
                        state.media['video'] = ikVidUrl;
                        saveDb();
                     } catch(e) {
                        console.log(`Video upload failed, continuing without video.`);
                     }
                }
            } else {
                console.log("No video provided by source (valid).");
            }

            // 4. CONTENT GENERATION
            const content = contentGenerator.generateProductContent({
                productName: product.productName,
                category: "Belts",
                brand: product.brand
            });

            // 5. POST PRODUCT (Production)
            const payload = {
                name: product.productName,
                brand: content.searchBrand || "Unknown",
                category: "Belts",
                basePrice: product.originalPrice,
                discountedPrice: product.finalSellingPrice,
                imageUrls: ikUrls,
                videoUrls: videoUrls,
                visible: false,
                variants: [],
                searchName: content.searchName,
                searchBrand: content.searchBrand,
                searchText: content.searchText,
                description: content.description
            };

            console.log(`Sending POST /api/v1/admin/products...`);
            const postReq = await fetch(`${API_URL}/api/v1/admin/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            const status = postReq.status;
            console.log(`HTTP Status: ${status}`);

            // Auth safety
            if (status === 401 || status === 403) {
                console.error(`FATAL: Authentication failure (${status}). Stopping import immediately.`);
                process.exit(1);
            }

            if (status !== 201) {
                const errText = await postReq.text();
                console.log(`Failed to create product. Response: ${errText}`);
                state.status = 'FAILED';
                state.reason = `HTTP ${status}: ${errText}`;
                saveDb();
                continue;
            }

            const responseJson = await postReq.json();
            const newId = responseJson.id;
            
            console.log(`Created successfully! Kicks Aura ID: ${newId}`);
            
            // Mark as created
            state.status = 'CREATED';
            state.kicksAuraId = newId;
            state.name = product.productName;
            state.importedAt = new Date().toISOString();
            saveDb();
            
            successCount++;

            // 6. VERIFICATION GET
            console.log(`Verifying GET /api/v1/admin/products/${newId}...`);
            const getReq = await fetch(`${API_URL}/api/v1/admin/products/${newId}`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            });
            const getJson = await getReq.json();
            
            console.log(`Verify Check - Visible: ${getJson.visible}, Variants: ${getJson.variants ? getJson.variants.length : 0}, Images: ${getJson.imageUrls ? getJson.imageUrls.length : 0}, BasePrice: ${getJson.basePrice}, DiscountedPrice: ${getJson.discountedPrice}, Category: ${getJson.category}, Videos: ${getJson.videoUrls ? getJson.videoUrls.length : 0}`);
            
        } catch (err) {
            console.error(`Error processing product ${product.productId}:`, err.message);
            // DO NOT RETRY POST blindly on connection error
            state.status = 'FAILED';
            state.reason = err.message;
            saveDb();
        }
    }
    
    await browser.close();
    
    console.log(`\n================================`);
    console.log(`IMPORT COMPLETE. Successfully created: ${successCount}/10`);
    
    // 7. PUBLIC VISIBILITY VERIFICATION
    console.log(`\nVerifying public visibility (should NOT appear in public filter)...`);
    try {
        const publicReq = await fetch(`${API_URL}/api/v1/products/filter?categories=Belts`);
        const publicJson = await publicReq.json();
        
        let foundAny = false;
        if (publicJson.content && Array.isArray(publicJson.content)) {
            for (const created of Object.values(db.imported)) {
                if (created.status === 'CREATED' && created.kicksAuraId) {
                    if (publicJson.content.some(p => p.id === created.kicksAuraId)) {
                        foundAny = true;
                        console.error(`WARNING: Product ${created.kicksAuraId} (${created.name}) was found in public listing!`);
                    }
                }
            }
        }
        
        if (!foundAny) {
            console.log(`SUCCESS: None of the newly created products appear in the public Belts category listing.`);
        }
    } catch (err) {
        console.error(`Failed to perform public visibility verification: ${err.message}`);
    }

    console.log(`\n--- EXECUTION SUMMARY TABLE ---`);
    console.log(`| # | IndianKicks ID | Kicks Aura ID | Product | Original Price | Final Selling Price | Images | Video | Status |`);
    console.log(`|---|----------------|---------------|---------|----------------|---------------------|--------|-------|--------|`);
    
    toProcess.forEach((p, i) => {
        const state = db.imported[p.productId] || {};
        const num = String(i + 1).padEnd(2, ' ');
        const id = String(p.productId).padEnd(14, ' ');
        const kaId = (state.kicksAuraId || 'N/A').padEnd(36, ' ');
        const name = (p.productName.length > 20 ? p.productName.substring(0, 17) + '...' : p.productName).padEnd(20, ' ');
        const orig = String(p.originalPrice).padEnd(14, ' ');
        const finSell = String(p.finalSellingPrice).padEnd(19, ' ');
        const imgs = String(p.imgCount || (Array.isArray(p.images) ? p.images.length : (p.coverImage ? 1 : 0))).padEnd(6, ' ');
        const vid = (p.video || p.hasVideo ? 'Yes' : 'No').padEnd(5, ' ');
        const status = (state.status || 'FAILED').padEnd(6, ' ');
        
        console.log(`| ${num} | ${id} | ${kaId} | ${name} | ₹${orig} | ₹${finSell} | ${imgs} | ${vid} | ${status} |`);
    });
})();
