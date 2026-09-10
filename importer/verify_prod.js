const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verify() {
    const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
    let token = process.env.KICKSAURA_ADMIN_TOKEN;
    
    if (!token) {
        console.log("No token found. Generating local JWT...");
        const crypto = require('crypto');
        const secretBase64 = process.env.JWT_SECRET;
        const secretBytes = Buffer.from(secretBase64, 'base64');
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: 'admin-importer-script', role: 'ROLE_ADMIN', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 };
        const b64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
        const headerEnc = b64UrlEncode(header);
        const payloadEnc = b64UrlEncode(payload);
        const signature = crypto.createHmac('sha256', secretBytes).update(headerEnc + '.' + payloadEnc).digest('base64').replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
        token = headerEnc + '.' + payloadEnc + '.' + signature;
    }

    console.log("Pinging /batch-lookup...");
    try {
        const res = await fetch(`${API_URL}/api/v1/admin/products/batch-lookup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceSite: "indiankicks.in",
                sourceProductIds: ["non-existent-123"]
            })
        });

        if (res.ok) {
            const data = await res.json();
            console.log(`Success! /batch-lookup returned: ${JSON.stringify(data)}`);
            if (Array.isArray(data)) {
                console.log("Endpoint works and returned an array.");
            }
        } else {
            console.log(`Failed! HTTP ${res.status}`);
            const text = await res.text();
            console.log(`Body: ${text}`);
        }
    } catch (e) {
        console.log("Error:", e);
    }
}

verify();
