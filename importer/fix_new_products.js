const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// CONFIGURATION
// ============================================================
const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

// Set to true to test on just the first product before running all
const TRIAL_MODE = false;

// Make sure you have GROQ_API_KEY in your .env file
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    console.error('FATAL: GROQ_API_KEY is missing from .env');
    process.exit(1);
}

// ============================================================
// TARGET PRODUCT IDs — RETRY: 13 failed products from previous run
// ============================================================
const PRODUCT_IDS = [
    // 2 x AI parse error (empty Groq response)
    '5cda0f24-a685-435f-9509-37bf19309b4e',
    '180fe924-0f9f-48f8-903a-f71921505c1f',
    // 11 x fetch failed (server connection dropped after product 92)
    'e09d3d56-5e21-4f48-939c-a66097000374',
    '4cf0b0f5-31c8-4b23-a62b-fc82e02ee2c3',
    '66ce3d24-e0d6-41fc-a152-b390b9e88c0c',
    'b3522dae-2820-44bf-a79e-20f8b966515b',
    '013dac86-47d9-4e45-b264-fab9a3f2afaf',
    '37617852-7634-4253-a962-1e9ebb2868bf',
    '2cecb0a9-42c2-4c09-8b50-810181dab466',
    'ae3aadf9-e018-4a12-a128-731ddff43a94',
    '1053d02c-0524-475b-b754-5239c4c01084',
    '0775f76a-7f29-435a-940a-dd8677837522',
    '9f564674-f5a7-401d-a523-3aa548090597',
];

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
// GROQ AI INTEGRATION
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
            await new Promise(r => setTimeout(r, 2000));
            continue;
        }

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        let textResponse = data.choices[0].message.content;
        
        try {
            textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) textResponse = jsonMatch[0];
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

    const idsToProcess = TRIAL_MODE ? PRODUCT_IDS.slice(0, 1) : PRODUCT_IDS;

    if (TRIAL_MODE) {
        console.log(`\n[TRIAL MODE] Running on 1 product only. Set TRIAL_MODE = false to process all ${PRODUCT_IDS.length}.`);
    }
    console.log(`\nProcessing ${idsToProcess.length} product(s) — correcting names & adding search keywords...\n`);

    let success = 0;
    let failed  = 0;
    const failedList = [];

    for (let i = 0; i < idsToProcess.length; i++) {
        const productId = idsToProcess[i];

        process.stdout.write(`\n[${i + 1}/${idsToProcess.length}] Fetching product ${productId} ...`);

        // 1. Fetch the product by ID
        let product;
        try {
            const getRes = await fetch(`${API_URL}/api/v1/admin/products/${productId}`, { headers });
            if (!getRes.ok) {
                const txt = await getRes.text();
                process.stdout.write(` FETCH FAILED HTTP ${getRes.status}\n`);
                failed++;
                failedList.push({ id: productId, name: '?', reason: `GET failed: ${txt}` });
                continue;
            }
            product = await getRes.json();
            process.stdout.write(` OK — "${product.name}"\n`);
        } catch (e) {
            process.stdout.write(` FETCH ERROR ${e.message}\n`);
            failed++;
            failedList.push({ id: productId, name: '?', reason: `GET error: ${e.message}` });
            continue;
        }

        // 2. Get AI corrections
        try {
            const aiData = await getAiCorrections(product.name, product.category, product.brand);

            const correctedName  = aiData.correctedName || product.name;
            const searchKeywords = (aiData.searchKeywords || []).join(' ');

            const updatedProduct = {
                ...product,
                name:        correctedName,
                searchText:  searchKeywords,
                searchName:  correctedName.toLowerCase().replace(/[^a-z0-9 ]/g, ''),
                searchBrand: (product.brand || '').toLowerCase()
            };

            process.stdout.write(`   -> Corrected Name: ${correctedName}\n`);
            process.stdout.write(`   -> Updating database ...`);

            // 3. PUT the updated product
            const putRes = await fetch(`${API_URL}/api/v1/admin/products/${product.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updatedProduct)
            });

            if (!putRes.ok) {
                const txt = await putRes.text();
                process.stdout.write(` FAILED HTTP ${putRes.status}\n`);
                failed++;
                failedList.push({ id: product.id, name: product.name, reason: txt });
            } else {
                process.stdout.write(' OK\n');
                success++;
            }
        } catch (e) {
            process.stdout.write(` ERROR ${e.message}\n`);
            failed++;
            failedList.push({ id: product.id, name: product.name, reason: e.message });
        }

        // Delay to avoid hitting Groq's rate limit
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
