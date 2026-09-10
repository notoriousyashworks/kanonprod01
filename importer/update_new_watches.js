const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { normalizeProductName } = require('./src/content/productNameNormalizer');
const { generateProductContent } = require('./src/content/contentGenerator');

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
let ADMIN_TOKEN = '';

function generateAdminJwt() {
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
}

async function updateWatches() {
    generateAdminJwt();
    
    console.log('Fetching all products from the admin endpoint...');
    let allProducts = [];
    let page = 0;
    
    while (true) {
        const res = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=200`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        const json = await res.json();
        
        allProducts.push(...json.content);
        if (json.last) break;
        page++;
    }

    // Filter only watches
    const watches = allProducts.filter(p => p.category === 'Watches');
    console.log(`Found ${watches.length} watches in DB.`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const p of watches) {
        // Use the original name as the base for normalization
        // If originalName is null/missing, fallback to p.name
        const rawName = p.originalName || p.name;
        
        // 1. Generate normalized display name
        let cleanName = normalizeProductName(rawName);
        
        // 2. Generate search fields based on the CLEAN name
        // (So that search fields are free of typos like "Rolee_x")
        const generatedContent = generateProductContent({
            productName: cleanName,
            brand: p.brand,
            category: p.category
        });
        
        // Check if anything needs updating
        const nameChanged = p.name !== cleanName;
        const searchNameChanged = p.searchName !== generatedContent.searchName;
        const searchBrandChanged = p.searchBrand !== generatedContent.searchBrand;
        const searchTextChanged = p.searchText !== generatedContent.searchText;
        const descChanged = p.description !== generatedContent.description;
        
        if (nameChanged || searchNameChanged || searchBrandChanged || searchTextChanged || descChanged) {
            // Construct PUT payload
            // DTO expects certain fields. We map the fetched product to the expected structure.
            const putPayload = {
                name: cleanName,
                originalName: p.originalName || p.name,
                brand: p.brand,
                category: p.category,
                basePrice: p.basePrice,
                discountedPrice: p.discountedPrice,
                imageUrls: p.imageUrls,
                videoUrls: p.videoUrls,
                visible: p.isVisible || p.visible || false,
                variants: p.variants || [],
                searchName: generatedContent.searchName,
                searchBrand: generatedContent.searchBrand,
                searchText: generatedContent.searchText,
                description: generatedContent.description,
                sourceSite: p.sourceSite,
                sourceProductId: p.sourceProductId
            };

            const putRes = await fetch(`${API_URL}/api/v1/admin/products/${p.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify(putPayload)
            });

            if (putRes.ok) {
                updatedCount++;
                console.log(`[UPDATED] ${rawName} -> ${cleanName}`);
            } else {
                console.error(`[ERROR] Failed to update ${rawName}: HTTP ${putRes.status} - ${await putRes.text()}`);
            }
        } else {
            skippedCount++;
        }
    }
    
    console.log('--- DONE ---');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (already clean): ${skippedCount}`);
}

updateWatches().catch(console.error);
