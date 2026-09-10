const fs = require('fs');
const { chromium } = require('playwright');

const PROGRESS_FILE = './count_mens_watches_progress.json';

function saveProgress(data) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // ── PHASE 1: Discover all slugs ──────────────────────────────
    console.log('Phase 1: Discovering all product slugs...');
    await page.goto('https://indiankicks.in/shop?c=mens-watch', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);

    let allSlugs = new Set();
    let clickCount = 0;
    let stuckCounter = 0;

    while (true) {
        const slugs = await page.evaluate(() => {
            const rootEl = document.querySelector('#root');
            if (!rootEl) return [];
            const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
            if (!fiberKey) return [];
            let curr = rootEl[fiberKey];
            let found = [];
            let visited = new Set();
            function search(node, depth = 0) {
                if (!node || depth > 500) return;
                if (visited.has(node)) return;
                visited.add(node);
                try {
                    const stateStr = JSON.stringify(node.memoizedState);
                    if (stateStr && stateStr.includes('siteSlug')) {
                        const match = stateStr.match(/"siteSlug":"([^"]+)"/g);
                        if (match) match.forEach(m => found.push(m.replace(/"siteSlug":"/, '').replace(/"/, '')));
                    }
                    const propStr = JSON.stringify(node.memoizedProps);
                    if (propStr && propStr.includes('siteSlug')) {
                        const match = propStr.match(/"siteSlug":"([^"]+)"/g);
                        if (match) match.forEach(m => found.push(m.replace(/"siteSlug":"/, '').replace(/"/, '')));
                    }
                } catch (e) {}
                if (node.child) search(node.child, depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found;
        });

        const before = allSlugs.size;
        slugs.forEach(s => allSlugs.add(s));
        const added = allSlugs.size - before;
        console.log('Click #' + clickCount + ' | Total slugs: ' + allSlugs.size);

        if (added === 0 && clickCount > 0) stuckCounter++;
        else stuckCounter = 0;
        if (stuckCounter > 3) { console.log('No new slugs. Discovery done.'); break; }

        const btn = await page.$('button:has-text("Load More Product"), button:has-text("Load More")');
        if (!btn) { console.log('No Load More button. Discovery done.'); break; }
        if (!await btn.isVisible() || await btn.isDisabled()) { console.log('Button disabled. Discovery done.'); break; }

        await btn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await btn.click();
        clickCount++;
        await page.waitForTimeout(4000);
    }

    const slugArr = Array.from(allSlugs);
    console.log('\nTotal slugs discovered: ' + slugArr.length);
    saveProgress({ phase: 'checking_stock', totalSlugs: slugArr.length, inStock: 0, outOfStock: 0, noData: 0, checked: 0 });

    // ── PHASE 2: Check stock on each product ─────────────────────
    console.log('\nPhase 2: Checking stock for each product...');
    const detailPage = await browser.newPage();
    let inStock = 0;
    let outOfStock = 0;
    let noData = 0;

    for (let i = 0; i < slugArr.length; i++) {
        const url = 'https://indiankicks.in/product-detail/' + slugArr[i];
        try {
            await detailPage.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
            await detailPage.waitForTimeout(3000);
        } catch (e) {
            noData++;
            console.log('[' + (i+1) + '/' + slugArr.length + '] TIMEOUT - skipping');
            continue;
        }

        const result = await detailPage.evaluate(() => {
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
                            if (val && val.productName && val.wpBasicPrice) { found = val; return; }
                        }
                        s = s.next;
                    }
                }
                if (node.child) search(node.child, depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found ? { outOfStock: found.outOfStock, stockCount: found.stockCount } : null;
        });

        if (!result) { noData++; }
        else if (result.outOfStock || result.stockCount === 0) { outOfStock++; }
        else { inStock++; }

        // Save progress every 10 products
        if ((i + 1) % 10 === 0) {
            saveProgress({ phase: 'checking_stock', totalSlugs: slugArr.length, inStock, outOfStock, noData, checked: i + 1 });
            console.log('[' + (i+1) + '/' + slugArr.length + '] inStock: ' + inStock + ' | outOfStock: ' + outOfStock + ' | noData: ' + noData);
        }
    }

    await browser.close();

    const final = { phase: 'done', totalSlugs: slugArr.length, inStock, outOfStock, noData, checked: slugArr.length };
    saveProgress(final);

    console.log('\n=============================');
    console.log('In Stock:     ' + inStock);
    console.log('Out of Stock: ' + outOfStock);
    console.log('No Data:      ' + noData);
    console.log('TOTAL:        ' + slugArr.length);
    console.log('\nANSWER: ' + inStock + ' mens watches are in stock on indiankicks.in');
})();
