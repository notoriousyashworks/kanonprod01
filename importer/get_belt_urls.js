const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://indiankicks.in/category/belts', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const urls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/product-detail/"]')).map(a => a.href);
  });

  console.log(JSON.stringify([...new Set(urls)], null, 2));

  await browser.close();
})();
