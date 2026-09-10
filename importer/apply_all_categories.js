const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

function generateToken() {
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    const h = b64Url({ alg:'HS256', typ:'JWT' });
    const p = b64Url({ sub:'admin-importer-script', role:'ROLE_ADMIN', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600*24 });
    return h+'.'+p+'.'+ crypto.createHmac('sha256', secretBytes).update(h+'.'+p).digest('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getProduct(token, id) {
  const resp = await fetch(`${API_URL}/api/v1/admin/products/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    signal: AbortSignal.timeout(20000)
  });
  if (!resp.ok) throw new Error(`GET ${id} failed: HTTP ${resp.status}`);
  return resp.json();
}

async function updateProductName(token, id, newName, category, product) {
  const lowerName = newName.toLowerCase();
  let updatedSearchText = product.searchText || '';
  if (!updatedSearchText.toLowerCase().includes(lowerName)) {
    updatedSearchText = updatedSearchText ? `${updatedSearchText} ${lowerName}` : lowerName;
  }

  const payload = {
    name:            newName,
    originalName:    product.originalName || product.name,
    searchName:      product.searchName   || '',
    brand:           product.brand        || '',
    searchBrand:     product.searchBrand  || '',
    searchText:      updatedSearchText,
    category:        product.category     || category,
    description:     product.description  || '',
    basePrice:       product.basePrice,
    discountedPrice: product.discountedPrice,
    imageUrls:       product.imageUrls    || [],
    videoUrls:       product.videoUrls    || [],
    isVisible:       product.isVisible,
    isSaleVisible:   product.isSaleVisible,
    isNewArrival:    product.isNewArrival,
    isTrending:      product.isTrending,
    isVideoVisible:  product.isVideoVisible,
    withOgBox:       product.withOgBox,
    isInStockFlag:   product.isInStockFlag,
    limitedStock:    product.limitedStock,
    variants:        product.variants     || [],
    sourceSite:      product.sourceSite   || '',
    sourceProductId: product.sourceProductId || '',
  };

  const resp = await fetch(`${API_URL}/api/v1/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000)
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`PUT ${id} failed: HTTP ${resp.status} — ${txt}`);
  }
  return resp.json();
}

(async () => {
  const token = generateToken();
  const corrections = JSON.parse(fs.readFileSync('/tmp/all_categories_corrections.json', 'utf8'));
  const ids = Object.keys(corrections);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`BULK CATEGORIES NAME AUDIT — Applying ${ids.length} corrections`);
  console.log(`${'='.repeat(60)}\n`);

  if (ids.length === 0) return;

  let success = 0, failed = 0, skipped = 0;
  const failedList = [];
  const log = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const correction = corrections[id];
    const newName = typeof correction === 'string' ? correction : correction.name;
    const category = typeof correction === 'string' ? 'Misc' : (correction.category || 'Misc');

    process.stdout.write(`[${i+1}/${ids.length}] ${id.slice(0,8)}… → "${newName}" … `);

    try {
      const product = await getProduct(token, id);
      const oldName = product.name;

      if (oldName === newName) {
        process.stdout.write('SKIP (already correct)\n');
        skipped++;
        log.push({ id, oldName, newName, status: 'SKIPPED' });
        continue;
      }

      await updateProductName(token, id, newName, category, product);
      process.stdout.write('✅ OK\n');
      success++;
      log.push({ id, oldName, newName, status: 'UPDATED' });
    } catch (err) {
      process.stdout.write(`❌ FAILED: ${err.message}\n`);
      failed++;
      failedList.push({ id, newName, error: err.message });
      log.push({ id, newName, status: 'FAILED', error: err.message });
    }

    await sleep(200);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('DONE');
  console.log(`${'='.repeat(60)}`);
  console.log(`Updated:  ${success}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);

  if (failedList.length > 0) {
    console.log('\nFailed products:');
    failedList.forEach(f => console.log(`  • ${f.id}: ${f.error}`));
  }

  fs.writeFileSync('/tmp/all_categories_update_log.json', JSON.stringify(log, null, 2));
  console.log('\nFull log saved to /tmp/all_categories_update_log.json');
})();
