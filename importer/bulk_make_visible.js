const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// CONFIGURATION
// ============================================================
const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

// Which categories to make visible
const TARGET_CATEGORIES = ['Handbags', 'Perfumes', 'Wallets'];

// Page size when fetching from admin endpoint
const PAGE_SIZE = 100;

// ============================================================
// JWT generator (same as importer scripts)
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

    const categorySet = new Set(TARGET_CATEGORIES.map(c => c.toLowerCase()));

    console.log('\nFetching all products from admin API...');
    console.log('Target categories: ' + TARGET_CATEGORIES.join(', ') + '\n');

    let page        = 0;
    let totalPages  = 1;
    let toMakeVisible = [];

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
            const cat = (p.category || '').toLowerCase();
            if (categorySet.has(cat) && !p.isVisible) {
                toMakeVisible.push({ id: p.id, name: p.name, category: p.category });
            }
        }

        console.log('  Page ' + (page + 1) + '/' + totalPages + ' — ' + products.length + ' products, hidden-in-category so far: ' + toMakeVisible.length);
        page++;
    }

    console.log('\n------------------------------------------');
    console.log('Found ' + toMakeVisible.length + ' hidden products in [' + TARGET_CATEGORIES.join(', ') + ']');
    console.log('------------------------------------------\n');

    if (toMakeVisible.length === 0) {
        console.log('Nothing to do. All products in those categories are already visible.');
        return;
    }

    let success = 0;
    let failed  = 0;
    const failedList = [];

    for (let i = 0; i < toMakeVisible.length; i++) {
        const { id, name, category } = toMakeVisible[i];
        process.stdout.write('[' + (i + 1) + '/' + toMakeVisible.length + '] Making visible: ' + category + ' | ' + name + ' ...');

        try {
            const patchRes = await fetch(`${API_URL}/api/v1/admin/products/${id}/visibility`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ isVisible: true })
            });

            if (!patchRes.ok) {
                const txt = await patchRes.text();
                process.stdout.write(' FAILED HTTP ' + patchRes.status + '\n');
                failed++;
                failedList.push({ id, name, reason: txt });
            } else {
                process.stdout.write(' OK\n');
                success++;
            }
        } catch (e) {
            process.stdout.write(' ERROR ' + e.message + '\n');
            failed++;
            failedList.push({ id, name, reason: e.message });
        }
    }

    console.log('\n==========================================');
    console.log('DONE');
    console.log('==========================================');
    console.log('Successfully made visible : ' + success);
    console.log('Failed                    : ' + failed);
    if (failedList.length > 0) {
        console.log('\nFailed products:');
        failedList.forEach(f => console.log('  - ' + f.id + ' | ' + f.name + ': ' + f.reason));
    }
})();
