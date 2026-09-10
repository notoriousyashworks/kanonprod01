const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

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

const flaggedSourceIds = new Set([
    '47', '48', '49', '70', '71', '72', '93', 
    '111', '50', '100', 
    '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', 
    '1', '2', '3', '4', '5', 
    '52', '53', '54', '55', '56', 
    '128', '129', '130', '131', '132', '148', 
    '23', '36'
]);

async function makeAllVisible() {
    generateAdminJwt();
    
    console.log('Fetching all products from the backend...');
    let allProducts = [];
    let page = 0;
    
    while (true) {
        const res = await fetch(`${API_URL}/api/v1/products?page=${page}&size=200`);
        const json = await res.json();
        
        allProducts.push(...json.content);
        if (json.last) break;
        page++;
    }
    
    // Also fetch admin route to make sure we get hidden products
    console.log(`Fetched ${allProducts.length} public products. Fetching admin products to get hidden ones...`);
    allProducts = [];
    page = 0;
    while (true) {
        const res = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=200`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        const json = await res.json();
        
        allProducts.push(...json.content);
        if (json.last) break;
        page++;
    }

    console.log(`Total products in DB: ${allProducts.length}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const p of allProducts) {
        const isFlagged = flaggedSourceIds.has(p.sourceProductId);
        
        if (isFlagged) {
            console.log(`Skipping flagged product: ${p.name} (Source ID: ${p.sourceProductId})`);
            skippedCount++;
            continue;
        }
        
        if (p.visible !== true && p.isVisible !== true) {
            // Need to update
            const patchRes = await fetch(`${API_URL}/api/v1/admin/products/${p.id}/visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify({ isVisible: true })
            });
            
            if (patchRes.ok) {
                updatedCount++;
                console.log(`[UPDATED] Made visible: ${p.name}`);
            } else {
                console.error(`Failed to update ${p.name}: ${patchRes.status}`);
            }
        }
    }
    
    console.log('--- DONE ---');
    console.log(`Updated to visible: ${updatedCount}`);
    console.log(`Skipped (Flagged): ${skippedCount}`);
}

makeAllVisible().catch(console.error);
