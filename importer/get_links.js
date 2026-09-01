const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('https://indiankicks.in/shop?c=sunglasses-eye-wear-women', { waitUntil: 'networkidle' });
    
    let allLinks = new Set();
    
    function extractLinks(page) {
        return page.evaluate(() => {
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
                        const match = stateStr.match(/\"siteSlug\":\"([^\"]+)\"/g);
                        if (match) match.forEach(m => found.push(m.replace(/\"siteSlug\":\"/, '').replace(/\"/, '')));
                    }
                    const propStr = JSON.stringify(node.memoizedProps);
                    if (propStr && propStr.includes('siteSlug')) {
                        const match = propStr.match(/\"siteSlug\":\"([^\"]+)\"/g);
                        if (match) match.forEach(m => found.push(m.replace(/\"siteSlug\":\"/, '').replace(/\"/, '')));
                    }
                } catch (e) {}
                if (node.child) search(node.child, depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found;
        });
    }

    let clickCount = 0;
    while (true) {
        // Extract current links and merge
        const currentLinks = await extractLinks(page);
        const beforeCount = allLinks.size;
        currentLinks.forEach(l => allLinks.add(l));
        const domCount = await page.evaluate(() => document.querySelectorAll('h3.line-clamp-1').length);
        
        console.log(`Click #${clickCount} | DOM products: ${domCount} | Unique Extracted: ${allLinks.size}`);
        
        if (allLinks.size >= 50) {
            console.log('Reached 50+ target. Stopping.');
            break;
        }

        // Find Load More button
        const loadMoreBtn = await page.$('button:has-text("Load More Product"), button:has-text("Load More")');
        if (!loadMoreBtn) {
            console.log('Load More button not found. Exhausted list.');
            break;
        }

        // Check if disabled or hidden
        const isVisible = await loadMoreBtn.isVisible();
        const isDisabled = await loadMoreBtn.isDisabled();
        if (!isVisible || isDisabled) {
            console.log('Load More button is hidden or disabled. Exhausted list.');
            break;
        }

        // Scroll the button into view and click
        await loadMoreBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await loadMoreBtn.click();
        clickCount++;
        
        // Wait for network activity or a short timeout
        await page.waitForTimeout(4000); // 4 seconds to let React render and fetch
        
        // Failsafe: if we didn't add any new links after 3 consecutive clicks, stop
        if (allLinks.size === beforeCount && clickCount > 3) {
            console.log('No new products added after recent clicks. Stopping.');
            break;
        }
    }
    
    console.log('Total unique siteSlugs found:', allLinks.size);
    if (allLinks.size > 0) {
        fs.writeFileSync(
            path.join(__dirname, 'tmp', 'sunglass_links.json'), 
            JSON.stringify(Array.from(allLinks).map(s => 'https://indiankicks.in/product-detail/' + s), null, 2)
        );
    }
    await browser.close();
})();
