const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

function generateToken() {
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const header      = { alg: 'HS256', typ: 'JWT' };
    const jwtPayload  = {
        sub: 'admin-importer-script', role: 'ROLE_ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
    };
    const b64Url = (obj) =>
        Buffer.from(JSON.stringify(obj)).toString('base64')
            .replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    const h = b64Url(header), p = b64Url(jwtPayload);
    const sig = crypto.createHmac('sha256', secretBytes).update(h+'.'+p)
        .digest('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    return h+'.'+p+'.'+sig;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(token, page, pageSize, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use the filter endpoint with exact category name "Watches" — mirrors the website
      const url = `${API_URL}/api/v1/admin/products?page=${page}&size=${pageSize}`;
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      return await resp.json();
    } catch (err) {
      process.stderr.write(`  Page ${page} attempt ${attempt} failed: ${err.message}\n`);
      if (attempt < retries) await sleep(2000 * attempt);
      else throw err;
    }
  }
}

async function fetchAllWatches(token) {
  const pageSize = 100;
  let allProducts = [];
  let totalPages = 1;

  for (let page = 0; page < totalPages; page++) {
    const data = await fetchPage(token, page, pageSize);
    totalPages = data.totalPages;
    const products = data.content || [];

    // Exact match: only products whose category is exactly "Watches"
    const watches = products.filter(p => {
      const cat = (p.category || '').trim();
      return cat === 'Watches';
    });

    allProducts = allProducts.concat(watches);
    process.stderr.write(`Page ${page+1}/${totalPages}: ${products.length} products, ${watches.length} watches → total: ${allProducts.length}\n`);
    await sleep(300);
  }
  return allProducts;
}

(async () => {
  try {
    const token = generateToken();
    process.stderr.write('JWT OK\n');
    const watches = await fetchAllWatches(token);
    const slim = watches.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sourceProductId: p.sourceProductId || null,
      sourceSite: p.sourceSite || null,
      imageUrls: (p.imageUrls || []).slice(0, 1)
    }));
    process.stdout.write(JSON.stringify(slim, null, 2));
    process.stderr.write(`\nDone. Total "Watches" category products: ${watches.length}\n`);
  } catch (err) {
    process.stderr.write('FATAL: ' + err.message + '\n');
    process.exit(1);
  }
})();
