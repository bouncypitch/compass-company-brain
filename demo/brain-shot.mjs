import { launch, login, BASE } from './lib.mjs';
const { browser, page } = await launch();
await login(page, 'jordan@forgeline.dev');
await page.goto(`${BASE}/demo?s=problem`);
await page.waitForSelector('[data-slide="problem"]', { timeout: 30000 });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'checkpoints/v5-brain.png' });
await browser.close();
