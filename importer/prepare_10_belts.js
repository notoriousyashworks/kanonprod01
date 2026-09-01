const { normalizeProductName } = require('./src/content/productNameNormalizer');
const fs = require('fs');
const { chromium } = require('playwright');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const PLAN_PATH = path.join(__dirname, 'tmp', 'batch_plan.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ imported: {} }, null, 2));
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

function generateCharmPrice(original, selling) {
  // e.g. 1200 -> 1199, 1199 -> 1200, 1500 -> 1499, 1800 -> 1799
  if (selling <= 0) return selling;
  
  const lastTwo = selling % 100;
  let newSelling = selling;

  if (lastTwo === 0) {
    // 1200 -> 1199
    newSelling = selling - 1;
  } else if (lastTwo === 99) {
    // 1199 -> 1200
    newSelling = selling + 1;
  } else if (lastTwo === 50) {
    // 1250 -> 1249
    newSelling = selling - 1;
  } else if (selling % 10 === 0) {
    // 1230 -> 1249
    newSelling = selling + 19;
  } else {
    // random small adjustment
    newSelling = selling + (Math.random() > 0.5 ? -1 : 1);
  }

  // Ensure it's below original price and positive
  if (newSelling >= original) {
    newSelling = original - 1;
  }
  if (newSelling <= 0) {
    newSelling = selling; 
  }
  return newSelling;
}

(async () => {
  console.log('Starting product discovery...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const uniqueLinks = [
  "https://indiankicks.in/product-detail/coacch-2pcs-belt-7-amp-8-npi672273561-indiankicks11",
  "https://indiankicks.in/product-detail/coacch-2pcs-belt-5-amp-6-npi672266598-indiankicks11",
  "https://indiankicks.in/product-detail/coacch-belt-c219-npi671255907-indiankicks11",
  "https://indiankicks.in/product-detail/coacch-belt-c218-npi671253084-indiankicks11",
  "https://indiankicks.in/product-detail/armaani-belt-with-box-carry-bag-a227-npi671252584-indiankicks11",
  "https://indiankicks.in/product-detail/mont-blan-black-premium-quality-belt-fa-995-npi670950120-indiankicks11",
  "https://indiankicks.in/product-detail/ax-arma-gold-glossy-reversible-belt-fa-1104-npi670947106-indiankicks11",
  "https://indiankicks.in/product-detail/lv-014-twotone-buccal-black-brown-reversible-belt-with-og-box-npi670732707-indiankicks11",
  "https://indiankicks.in/product-detail/us-polo-black-premium-quality-belt-fa-757-npi670413937-indiankicks11",
  "https://indiankicks.in/product-detail/gucc-glossy-reversible-belt-black-fa-667-npi670361755-indiankicks11",
  "https://indiankicks.in/product-detail/gucc-black-reversible-belt-fa-163-npi669936159-indiankicks11",
  "https://indiankicks.in/product-detail/hermees-belt-h-98-npi669614461-indiankicks11",
  "https://indiankicks.in/product-detail/hermees-belt-h-97-npi669611015-indiankicks11",
  "https://indiankicks.in/product-detail/hermees-belt-h-96-npi669607734-indiankicks11",
  "https://indiankicks.in/product-detail/ferragam-o-black-reversible-belt-fa-406-npi668482894-indiankicks11",
  "https://indiankicks.in/product-detail/burberr-black-reversible-belt-fa-336-npi667857515-indiankicks11",
  "https://indiankicks.in/product-detail/burberrry-belt-b195-npi665739205-indiankicks11",
  "https://indiankicks.in/product-detail/burberrry-belt-b195-npi665737630-indiankicks11",
  "https://indiankicks.in/product-detail/burberrry-belt-b194-npi665736049-indiankicks11",
  "https://indiankicks.in/product-detail/coacch-728-silver-metal-logo-black-brown-reversible-belt-with-og-box-npi665066709-indiankicks11",
  "https://indiankicks.in/product-detail/tommmy-hilfiger-belt-t104-npi664180486-indiankicks11",
  "https://indiankicks.in/product-detail/ax-exchange-reversible-belt-fa-474-npi662749211-indiankicks11",
  "https://indiankicks.in/product-detail/pol-o-golden-reversible-belt-fa-419-npi661605300-indiankicks11",
  "https://indiankicks.in/product-detail/coa-c-grey-reversible-belt-fa-614-npi659302736-indiankicks11",
  "https://indiankicks.in/product-detail/tommy-832-silver-metal-clipper-buccal-with-black-brown-reversible-crocodile-leather-belt-with-og-box-npi659200745-indiankicks11",
  "https://indiankicks.in/product-detail/lv-loui-black-brown-belt-fa-916-npi658643260-indiankicks11",
  "https://indiankicks.in/product-detail/cd-dioo-r-ladies-belt-wid-og-box-card-npi657815442-indiankicks11"
  ];
  
  let products = [];
  
  for (const link of uniqueLinks) {
     if (products.length >= 15) break; // get enough to filter 10 valid
     await page.goto(link, { waitUntil: 'domcontentloaded' });
     await page.waitForTimeout(2000);
     
     const p = await page.evaluate(() => {
        const rootEl = document.querySelector('#root');
        if (!rootEl) return null;
        const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
        if (!fiberKey) return null;
        let curr = rootEl[fiberKey];
        let found = null;
        function search(node, depth = 0) {
          if (!node || depth > 50 || found) return;
          if (node.memoizedState) {
            let s = node.memoizedState;
            while (s) {
              if (s.memoizedState && typeof s.memoizedState === 'object') {
                const val = s.memoizedState;
                if (val && val.productName && val.wpBasicPrice) {
                  found = val;
                  return;
                }
              }
              s = s.next;
            }
          }
          if (node.child) search(node.child, depth + 1);
          if (node.sibling) search(node.sibling, depth + 1);
        }
        search(curr);
        return found;
     });
     
     if (p) products.push(p);
  }
  
  await browser.close();

  if (products.length === 0) {
    console.error('Failed to find any products. STOPPING.');
    return;
  }

  console.log(`Extracted ${products.length} products total.`);

  // Filter 10 valid belts
  const selected = [];
  
  for (const p of products) {
    if (selected.length >= 10) break;
    
    // Validate it's a belt
    const name = (p.productName || '').toLowerCase();
    const cat = (p.categoryName || '').toLowerCase();
    if (!name.includes('belt') && !cat.includes('belt')) {
      console.log(`Skipping ${p.productId}: Not a belt`);
      continue;
    }
    
    // Check local db duplicate
    if (db.imported && db.imported[p.productId] && db.imported[p.productId].status === 'CREATED') {
      console.log(`Skipping already imported product: ${p.productId}`);
      continue;
    }
    
    if (p.productId === 'NPI670950120') {
      console.log(`Skipping known test product: ${p.productId}`);
      continue;
    }

    const nameLower = (p.productName || '').toLowerCase();
    const categoryLower = (p.categoryName || '').toLowerCase();
    
    if (!nameLower.includes('belt') && !categoryLower.includes('belt')) {
      console.log(`Skipping non-belt product: ${p.productName}`);
      continue;
    }
    
    const selling = parseFloat(p.wpBasicPrice) || parseFloat(p.sourceSellingPrice) || 0;
    const original = parseFloat(p.wpOldPrice) || parseFloat(p.originalPrice) || 0;
    
    if (selling <= 0 || original <= 0 || selling > original) {
      console.log(`Skipping product due to invalid price: ${p.productName}`);
      continue;
    }
    
    // Validate images
    let g = p.gallery;
    if (typeof g === 'string') {
      try { g = JSON.parse(g); } catch (e) { g = []; }
    }
    let imgCount = 0;
    if (Array.isArray(g)) {
      imgCount = g.length;
    } else if (p.image) {
      imgCount = 1;
    }
    if (imgCount === 0) {
      console.log(`Skipping ${p.productId}: No images`);
      continue;
    }
    
    const prodId = p.productId || p.seoUrl || p.id || 'unknown_' + Math.random().toString(36).substring(7);
    const cleanName = normalizeProductName(p.productName);
    
    selected.push({
      productId: prodId,
      rawName: p.productName,
      productName: cleanName,
      originalPrice: original,
      sourceSellingPrice: selling,
      images: g,
      coverImage: p.image,
      video: p.video,
      brand: p.brandName || 'Unknown'
    });
  }

  if (selected.length < 10) {
    console.error(`Only found ${selected.length} eligible products. Required exactly 10. STOPPING.`);
    return;
  }

  // Adjust pricing for exactly 3 to 5 products
  const numAdjusted = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
  
  // Shuffle indices to randomly pick which ones get adjusted
  const indices = Array.from({length: 10}, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const adjustIndices = new Set(indices.slice(0, numAdjusted));
  
  const finalPlan = selected.map((p, index) => {
    const isAdjusted = adjustIndices.has(index);
    const finalSelling = isAdjusted ? generateCharmPrice(p.originalPrice, p.sourceSellingPrice) : p.sourceSellingPrice;
    
    return {
      ...p,
      finalSellingPrice: finalSelling,
      isAdjusted,
      imgCount: Array.isArray(p.images) ? p.images.length : (p.coverImage ? 1 : 0),
      hasVideo: !!p.video
    };
  });

  // Save to batch_plan.json
  if (!fs.existsSync(path.join(__dirname, 'tmp'))) {
    fs.mkdirSync(path.join(__dirname, 'tmp'));
  }
  fs.writeFileSync(PLAN_PATH, JSON.stringify(finalPlan, null, 2));

  // Print Summary Table
  console.log(`\n--- 10-PRODUCT BATCH PLAN SUMMARY ---`);
  console.log(`| #  | IndianKicks ID | Raw Name | Clean Name | Original Price | Source Selling | Final Selling | Adjusted | Images | Video |`);
  console.log(`|----|----------------|----------|------------|----------------|----------------|---------------|----------|--------|-------|`);
  
  finalPlan.forEach((p, i) => {
    const num = String(i + 1).padEnd(2, ' ');
    const prodId = p.productId || p.seoUrl || p.id || 'unknown';
    const id = String(prodId).padEnd(14, ' ');
    const rawNameStr = (p.rawName.length > 15 ? p.rawName.substring(0, 12) + '...' : p.rawName).padEnd(15, ' ');
    const name = (p.productName.length > 20 ? p.productName.substring(0, 17) + '...' : p.productName).padEnd(20, ' ');
    const orig = String(p.originalPrice).padEnd(14, ' ');
    const srcSell = String(p.sourceSellingPrice).padEnd(14, ' ');
    const finSell = String(p.finalSellingPrice).padEnd(13, ' ');
    const adj = (p.adjusted ? 'Yes' : 'No').padEnd(8, ' ');
    const imgs = String(p.imgCount).padEnd(6, ' ');
    const vid = (p.hasVideo ? 'Yes' : 'No').padEnd(5, ' ');
    
    console.log(`| ${num} | ${id} | ${rawNameStr} | ${name} | ₹${orig} | ₹${srcSell} | ₹${finSell} | ${adj} | ${imgs} | ${vid} |`);
  });
  
  console.log(`\nTotal Adjusted: ${numAdjusted}`);
  console.log('Preparation complete. Awaiting user approval to proceed with execution.');

})();
