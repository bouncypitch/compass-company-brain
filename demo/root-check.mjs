import { launch, BASE } from './lib.mjs';
const { browser, page } = await launch();
await page.goto(`${BASE}/`);
await page.waitForTimeout(5000);
console.log('root lands on:', page.url());
await browser.close();
