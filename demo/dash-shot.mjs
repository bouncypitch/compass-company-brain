import { launch, login, BASE } from './lib.mjs';
const { browser, page } = await launch();
await login(page);
await page.goto(`${BASE}/dashboard`);
await page.waitForTimeout(3000);
await page.screenshot({ path: 'checkpoints/home-dashboard.png' });
await browser.close();
