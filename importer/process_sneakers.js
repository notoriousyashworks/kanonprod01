const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
const CATEGORY = 'Sneakers';

// CLI arguments
const args = process.argv.slice(2);
const APPLY = args.includes('--apply'); // Pass --apply to actually update the DB

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

async function fetchPage(token, page, pageSize, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=${pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      if (attempt < retries) await sleep(2000 * attempt);
      else throw err;
    }
  }
}

async function updateProductName(token, id, newName, product) {
  const lowerName = newName.toLowerCase();
  let updatedSearchText = product.searchText || '';
  // Add to hidden search keyword field if not already present
  if (!updatedSearchText.toLowerCase().includes(lowerName)) {
    updatedSearchText = updatedSearchText ? `${updatedSearchText} ${lowerName}` : lowerName;
  }

  const payload = {
    name:            newName,
    originalName:    product.originalName || product.name, // Preserving originalName
    searchName:      product.searchName   || '',
    brand:           product.brand        || '',
    searchBrand:     product.searchBrand  || '',
    searchText:      updatedSearchText,
    category:        product.category     || CATEGORY,
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
  let totalPages = 1;
  const pageSize = 100;
  let allSneakers = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`FETCHING SNEAKERS...`);
  console.log(`${'='.repeat(60)}\n`);

  for (let page = 0; page < totalPages; page++) {
    const data = await fetchPage(token, page, pageSize);
    totalPages = data.totalPages;
    const products = data.content || [];
    const filtered = products.filter(p => (p.category || '').trim() === CATEGORY);
    allSneakers = allSneakers.concat(filtered);
    process.stdout.write(`Page ${page+1}/${totalPages}: found ${filtered.length} sneakers\n`);
    await sleep(200);
  }

  console.log(`\nTotal Sneakers Found: ${allSneakers.length}`);

  // Common sneaker misspellings and formatting rules
  const replacements = [
    [/_/g, ' '], // Replace underscores with spaces
    [/\\s+/g, ' '], // Clean up double spaces
    [/\\bNikee\\b/ig, 'Nike'], 
    [/\\bJordann\\b/ig, 'Jordan'], 
    [/\\bAdiadas\\b/ig, 'Adidas'],
    [/\\bAdidaas\\b/ig, 'Adidas'], 
    [/\\bAdiidas\\b/ig, 'Adidas'], 
    [/\\bYezzy\\b/ig, 'Yeezy'],
    [/\\bPummaa\\b/ig, 'Puma'],
    [/\\bBaleenciag\\b/ig, 'Balenciaga'],
    [/\\bBalenciag\\b/ig, 'Balenciaga'],
    [/\\bGuccci\\b/ig, 'Gucci'],
    [/\\bGucc i\\b/ig, 'Gucci']
  ];

  let success = 0, failed = 0, skipped = 0;
  const log = [];

  console.log(`\n${'='.repeat(60)}`);
  if (!APPLY) {
    console.log(`SNEAKER NAME AUDIT — DRY RUN (No changes will be saved)`);
    console.log(`Run with \`node process_sneakers.js --apply\` to execute.`);
  } else {
    console.log(`SNEAKER NAME AUDIT — APPLYING CORRECTIONS LIVE`);
  }
  console.log(`${'='.repeat(60)}\n`);

  for (let i = 0; i < allSneakers.length; i++) {
    const product = allSneakers[i];
    const oldName = product.name;
    let newName = oldName;

    // Apply Replacements
    for (const [regex, replacement] of replacements) {
      newName = newName.replace(regex, replacement);
    }
    newName = newName.trim();

    if (oldName === newName) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i+1}/${allSneakers.length}] ${product.id.slice(0,8)}…\n  Old: "${oldName}"\n  New: "${newName}"\n`);

    if (APPLY) {
      try {
        await updateProductName(token, product.id, newName, product);
        process.stdout.write('  ✅ OK\n\n');
        success++;
        log.push({ id: product.id, oldName, newName, status: 'UPDATED' });
      } catch (err) {
        process.stdout.write(`  ❌ FAILED: ${err.message}\n\n`);
        failed++;
        log.push({ id: product.id, oldName, newName, status: 'FAILED', error: err.message });
      }
      await sleep(200); // rate-limit
    } else {
      process.stdout.write('  ↷ DRY RUN (Skipped)\n\n');
      success++; 
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('DONE');
  console.log(`${'='.repeat(60)}`);
  
  if (!APPLY) {
    console.log(`Potential Updates Found: ${success}`);
    console.log(`Already Correct: ${skipped}`);
    console.log(`\nTo permanently apply these corrections, run:`);
    console.log(`  node process_sneakers.js --apply`);
  } else {
    console.log(`Updated:  ${success}`);
    console.log(`Skipped:  ${skipped}`);
    console.log(`Failed:   ${failed}`);
    fs.writeFileSync('/tmp/sneaker_updates_log.json', JSON.stringify(log, null, 2));
    console.log('\\nFull log saved to /tmp/sneaker_updates_log.json');
  }
})();
