const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// CONFIGURATION
// ============================================================
const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
const PAGE_SIZE = 50;

// Set to true if you want to test on just one page before running on all
const TEST_MODE = false; 
const MAX_PAGES_TEST = 1;

// Make sure you have GROQ_API_KEY in your .env file
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    console.error('FATAL: GROQ_API_KEY is missing from .env');
    process.exit(1);
}

// ============================================================
// JWT generator
// ============================================================
function generateToken() {
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const header      = { alg: 'HS256', typ: 'JWT' };
    const jwtPayload  = {
        sub: 'admin-importer-script',
        role: 'ROLE_ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
    };
    const b64Url = (obj) =>
        Buffer.from(JSON.stringify(obj)).toString('base64')
            .replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    const headerEnc  = b64Url(header);
    const payloadEnc = b64Url(jwtPayload);
    const signature  = crypto.createHmac('sha256', secretBytes)
        .update(headerEnc + '.' + payloadEnc)
        .digest('base64')
        .replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    return headerEnc + '.' + payloadEnc + '.' + signature;
}

// ============================================================
// GEMINI AI INTEGRATION
// ============================================================
async function getAiCorrections(productName, category, brand) {
    const prompt = `You are a helpful e-commerce data assistant. 
I have a product with the following raw data:
- Name: "${productName}"
- Category: "${category}"
- Brand: "${brand || 'Unknown'}"

Tasks:
1. Correct the product name: fix any spelling mistakes, and complete any incomplete words. Make the name clean, professional, and ready for an e-commerce storefront.
2. CRITICAL: Remove ANY product numbers, alphanumeric model codes, or SKUs from the final corrected name entirely (e.g., remove things like ES3121, FA995, 06, etc.). The final name should just be a human-readable title (e.g., "Fossil Jacqueline Sun Moon Copper Black").
3. Generate a maximum of 20 highly relevant search keywords for this product. Make sure to INCLUDE the model codes/numbers (like ES3121) in the keywords list, along with the brand, category, synonyms, related styles, colors (if implied), materials, and potential search phrases a user might type. Do NOT generate overly generic terms that apply to everything.

Return strictly a JSON object with this structure (no markdown blocks, no extra text):
{
  "correctedName": "The corrected professional product name without model numbers",
  "searchKeywords": ["keyword1", "keyword2", "..."]
}`;

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    let maxRetries = 10;
    
    const AI_MODELS = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'groq/compound',
        'groq/compound-mini',
        'qwen/qwen3.6-27b',
        'qwen/qwen3.8-27b'
    ];
    let currentModelIdx = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const currentModel = AI_MODELS[currentModelIdx];
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2
            })
        });

        if (response.status === 429) {
            console.log(`\n  [Rate Limit Hit] Rotating model and retrying... (Attempt ${attempt}/${maxRetries})`);
            currentModelIdx = (currentModelIdx + 1) % AI_MODELS.length;
            await new Promise(r => setTimeout(r, 2000)); // Short wait, then retry with new model
            continue;
        }

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        let textResponse = data.choices[0].message.content;
        
        try {
            // Strip markdown formatting if any
            textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                textResponse = jsonMatch[0];
            }
            return JSON.parse(textResponse);
        } catch (e) {
            throw new Error(`Failed to parse AI JSON: ${e.message}\nRaw: ${textResponse}`);
        }
    }
    throw new Error('Max retries exceeded for API rate limit');
}

// ============================================================
// MAIN
// ============================================================
(async () => {
    let ADMIN_TOKEN;
    try {
        ADMIN_TOKEN = generateToken();
        console.log('JWT generated successfully.');
    } catch (e) {
        console.error('FATAL: Could not generate token. ' + e.message);
        process.exit(1);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
    };

    console.log('\nFetching all products from admin API to correct names and search keywords via AI...\n');

    let page        = 0;
    let totalPages  = 1;
    let productsToUpdate = [];

    while (page < totalPages) {
        const res = await fetch(
            `${API_URL}/api/v1/admin/products?page=${page}&size=${PAGE_SIZE}`,
            { headers }
        );
        
        if (!res.ok) {
            console.error('FATAL: Admin GET failed with HTTP ' + res.status + ': ' + await res.text());
            process.exit(1);
        }
        
        const data = await res.json();
        totalPages = data.totalPages;

        const products = data.content || [];
        for (const p of products) {
            productsToUpdate.push(p);
        }

        console.log('  Fetched Page ' + (page + 1) + '/' + totalPages + ' — ' + products.length + ' products');
        
        page++;
        if (TEST_MODE && page >= MAX_PAGES_TEST) {
            console.log(`\n[TEST MODE] Stopping after ${MAX_PAGES_TEST} page(s). Set TEST_MODE = false to process all.`);
            break;
        }
    }

    console.log('\n------------------------------------------');
    console.log(`Total products to process: ${productsToUpdate.length}`);
    console.log('------------------------------------------\n');

    if (productsToUpdate.length === 0) {
        console.log('Nothing to do. No products found.');
        return;
    }

    let success = 0;
    let failed  = 0;
    const failedList = [];
    console.log(`\nFound ${productsToUpdate.length} total products to process.`);

    for (let i = 1825; i < productsToUpdate.length; i++) {
        const product = productsToUpdate[i];
        
        process.stdout.write(`\n[${i + 1}/${productsToUpdate.length}] Processing: ${product.name} ...\n`);

        try {
            // 1. Get AI corrections
            const aiData = await getAiCorrections(product.name, product.category, product.brand);
            
            // 2. Prepare updated fields
            const correctedName = aiData.correctedName || product.name;
            const searchKeywords = (aiData.searchKeywords || []).join(' ');
            
            // Note: We are overwriting the original name and updating the searchText
            const updatedProduct = {
                ...product,
                name: correctedName,
                searchText: searchKeywords,
                searchName: correctedName.toLowerCase().replace(/[^a-z0-9 ]/g, ''),
                searchBrand: (product.brand || '').toLowerCase()
            };

            process.stdout.write(`   -> Corrected Name: ${correctedName}\n`);
            process.stdout.write(`   -> Updating Database ...`);

            // 3. Update the product object in the database
            const putRes = await fetch(`${API_URL}/api/v1/admin/products/${product.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updatedProduct)
            });

            if (!putRes.ok) {
                const txt = await putRes.text();
                process.stdout.write(' FAILED HTTP ' + putRes.status + '\n');
                failed++;
                failedList.push({ id: product.id, name: product.name, reason: txt });
            } else {
                process.stdout.write(' OK\n');
                success++;
            }
        } catch (e) {
            process.stdout.write(' ERROR ' + e.message + '\n');
            failed++;
            failedList.push({ id: product.id, name: product.name, reason: e.message });
        }
        
        // Small delay to prevent rate-limiting from both our API and Gemini
        // Sleep to avoid hitting Groq's 30 RPM rate limit
        await new Promise(r => setTimeout(r, 2500));
    }

    console.log('\n==========================================');
    console.log('DONE');
    console.log('==========================================');
    console.log('Successfully updated : ' + success);
    console.log('Failed               : ' + failed);
    if (failedList.length > 0) {
        console.log('\nFailed products:');
        failedList.forEach(f => console.log('  - ' + f.id + ' | ' + f.name + ': ' + f.reason));
    }
})();
