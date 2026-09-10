const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://indiankicks.in/product-detail/tomm-y-hilgif-brown-belt-fa-906-npi618333363-indiankicks11', { waitUntil: 'networkidle' });
    const p = await page.evaluate(() => {
        const rootEl = document.querySelector('#root');
        if (!rootEl) return "NO ROOT";
        const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
        let curr = rootEl[fiberKey];
        let found = null;
        function search(node, depth = 0) {
            if (!node || depth > 80 || found) return;
            if (node.memoizedState) {
                let s = node.memoizedState;
                while (s) {
                    if (s.memoizedState && typeof s.memoizedState === 'object') {
                        const val = s.memoizedState;
                        if (val && val.productName) {
                            found = val;
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
    console.log(JSON.stringify(p, null, 2));
    await browser.close();
})();
