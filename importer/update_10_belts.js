require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { normalizeProductName } = require('./src/content/productNameNormalizer');
const { generateProductContent } = require('./src/content/contentGenerator');

const DB_PATH = path.join(__dirname, 'db.json');
const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
const ADMIN_TOKEN = process.env.KICKSAURA_ADMIN_TOKEN || process.env.kicksaura_auth_token;

// Target source IDs
const targetSourceIds = [
    '672272212', '672262117', '671254557', '671251233', '671250327',
    '670950031', '670945816', '670732547', '670412753', '670361460'
];

(async () => {
    if (!ADMIN_TOKEN) {
        console.error('Missing ADMIN_TOKEN. Stopping.');
        process.exit(1);
    }

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    let successCount = 0;

    console.log(`\n--- UPDATE SUMMARY ---`);
    console.log(`| Source ID | Kicks Aura ID | Old Name | New Name | Update Status |`);
    console.log(`|-----------|---------------|----------|----------|---------------|`);

    for (const sourceId of targetSourceIds) {
        const state = db.imported[sourceId];
        if (!state || !state.kicksAuraId) {
            console.error(`Skipping ${sourceId}: Not found in db.json`);
            continue;
        }

        const kicksAuraId = state.kicksAuraId;
        const oldName = state.name; // This was the old name sent

        try {
            // 1. GET existing product
            const getRes = await fetch(`${API_URL}/api/v1/admin/products/${kicksAuraId}`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            });

            if (!getRes.ok) {
                console.error(`Failed to GET ${kicksAuraId}: ${getRes.status}`);
                continue;
            }

            const existingProduct = await getRes.json();

            // 2. Generate new clean name
            // Note: For sourceId 671254557 (C219) and 671251233 (C218), we retain the code
            // The normalizer keeps them because we didn't add C### to the removal regex.
            const rawName = state.rawName || (sourceId === '672272212' ? 'COACCH 2PCS BELT 7_&_8' : (sourceId === '672262117' ? 'COACCH 2PCS BELT 5_&_6' : oldName));
            let newName = normalizeProductName(rawName);

            // Special handling for the 2 Coach belts if rawName wasn't in db.json initially
            if (sourceId === '672272212') newName = 'Coach 2-Piece Belt Set 7 & 8';
            if (sourceId === '672262117') newName = 'Coach 2-Piece Belt Set 5 & 6';
            if (sourceId === '671254557') newName = 'Coach Belt C219';
            if (sourceId === '671251233') newName = 'Coach Belt C218';
            if (sourceId === '671250327') newName = 'Armani Belt with Box & Carry Bag';
            if (sourceId === '670950031') newName = 'Mont Blanc Black Premium Quality Belt';
            if (sourceId === '670945816') newName = 'Armani Exchange Gold Glossy Reversible Belt';
            if (sourceId === '670732547') newName = 'Louis Vuitton Twotone Buccal Black Brown Reversible Belt with Og Box';
            if (sourceId === '670412753') newName = 'U.S. Polo Black Premium Quality Belt';
            if (sourceId === '670361460') newName = 'Gucci Glossy Reversible Belt Black';

            // 3. Generate new content
            const content = generateProductContent({
                productName: newName,
                category: "Belts",
                brand: "Unknown" // The content generator will figure out the searchBrand
            });

            // 4. Update the DTO exactly
            // We use the exact schema required for PUT /api/v1/admin/products
            const updatePayload = {
                name: newName,
                searchName: content.searchName,
                brand: content.searchBrand || existingProduct.brand || "Unknown",
                searchBrand: content.searchBrand,
                searchText: content.searchText,
                category: existingProduct.category,
                description: content.description,
                basePrice: existingProduct.basePrice,
                discountedPrice: existingProduct.discountedPrice,
                imageUrls: existingProduct.imageUrls || [],
                videoUrls: existingProduct.videoUrls || [],
                visible: existingProduct.visible,
                isSaleVisible: existingProduct.isSaleVisible || false,
                isNewArrival: existingProduct.isNewArrival || false,
                isTrending: existingProduct.isTrending || false,
                isVideoVisible: existingProduct.isVideoVisible || false,
                withOgBox: existingProduct.withOgBox || false,
                isInStockFlag: existingProduct.isInStockFlag !== undefined ? existingProduct.isInStockFlag : true,
                limitedStock: existingProduct.limitedStock || false,
                variants: existingProduct.variants || []
            };

            // 5. PUT update
            const putRes = await fetch(`${API_URL}/api/v1/admin/products/${kicksAuraId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (!putRes.ok) {
                const errText = await putRes.text();
                console.error(`Failed to PUT ${kicksAuraId}: HTTP ${putRes.status} - ${errText}`);
                console.log(`| ${sourceId.padEnd(9)} | ${kicksAuraId.padEnd(36)} | ${oldName.substring(0,20).padEnd(20)} | ${newName.substring(0,20).padEnd(20)} | FAILED        |`);
                continue;
            }

            // Update local DB
            state.name = newName;
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

            successCount++;
            console.log(`| ${sourceId.padEnd(9)} | ${kicksAuraId.padEnd(36)} | ${oldName.substring(0,20).padEnd(20)} | ${newName.substring(0,20).padEnd(20)} | SUCCESS       |`);
            
        } catch (err) {
            console.error(`Error processing ${sourceId}: ${err.message}`);
        }
    }

    console.log(`\nSuccessfully updated: ${successCount}/10 products`);

})();
