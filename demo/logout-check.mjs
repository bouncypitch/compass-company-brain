import { launch, BASE } from './lib.mjs';
const { browser, page } = await launch();
await page.goto(`${BASE}/demo`);
await page.waitForTimeout(5000);
console.log('signed-out /demo lands on:', page.url());
await browser.close();
