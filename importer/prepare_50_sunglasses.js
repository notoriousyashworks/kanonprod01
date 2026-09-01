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
  
  const uniqueLinks = JSON.parse(fs.readFileSync(path.join(__dirname, 'tmp', 'sunglass_links.json'), 'utf-8'));
  
  let products = [];
  
  for (const link of uniqueLinks) {
     if (products.length >= 60) break; // get enough to filter 50 valid
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
    if (selected.length >= 50) break;
    
    // Validation removed as per user request (all items in this category are considered sunglasses)
    
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

  if (selected.length === 0) {
    console.error(`Found 0 eligible products. STOPPING.`);
    return;
  }

  // Adjust pricing for exactly 3 to 5 products
  const numAdjusted = Math.min(selected.length, Math.floor(Math.random() * 3) + 3); // 3, 4, or 5
  
  // Shuffle indices to randomly pick which ones get adjusted
  const indices = Array.from({length: selected.length}, (_, i) => i);
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
  console.log(`\n--- BATCH PLAN SUMMARY (${selected.length} PRODUCTS) ---`);
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
