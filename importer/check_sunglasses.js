const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://indiankicks.in/shop?c=sunglasses-eye-wear-men', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    let allLinks = new Set();
    let keepDiscovering = true;
    let clickCount = 0;

    function extractLinks(pageObj) {
        return pageObj.evaluate(() => {
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
                } catch (e) { }
                if (node.child) search(node.child, depth + 1);
                if (node.sibling) search(node.sibling, depth + 1);
            }
            search(curr);
            return found;
        });
    }

    while (keepDiscovering && clickCount < 30) {
        const currentLinks = await extractLinks(page);
        const beforeCount = allLinks.size;
        currentLinks.forEach(l => allLinks.add(l));

        console.log(`Click #${clickCount} | Unique Extracted: ${allLinks.size} | This batch raw: ${currentLinks.length}`);

        const loadMoreBtn = await page.$('button:has-text("Load More Product"), button:has-text("Load More")');
        if (!loadMoreBtn) { console.log('No Load More button found.'); keepDiscovering = false; break; }
        
        const isVisible = await loadMoreBtn.isVisible();
        const isDisabled = await loadMoreBtn.isDisabled();
        if (!isVisible || isDisabled) { console.log('Load More button hidden or disabled.'); keepDiscovering = false; break; }

        await loadMoreBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await loadMoreBtn.click();
        clickCount++;
        await page.waitForTimeout(4000);

        if (allLinks.size === beforeCount && clickCount > 5) {
            console.log('No new links found after several clicks. Stopping.');
            keepDiscovering = false; break; 
        }
    }

    console.log(`\nTotal unique links found: ${allLinks.size}`);
    
    // Let's also check if there's text saying "9000 products"
    const text = await page.evaluate(() => document.body.innerText);
    const match = text.match(/(\d+)\s+products?/i);
    if (match) {
        console.log(`Page says: ${match[0]} found`);
    }

    await browser.close();
})();
