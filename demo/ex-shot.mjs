import { launch, login, BASE } from './lib.mjs';
const { browser, page } = await launch();
await login(page);
await page.goto(`${BASE}/demo?s=example`);
await page.waitForSelector('[data-slide="example"]', { timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'checkpoints/site-02-example.png' });
await browser.close();
