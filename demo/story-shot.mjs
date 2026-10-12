import { launch, login, BASE } from './lib.mjs';
const { browser, page } = await launch();
await login(page);
await page.goto(`${BASE}/brain`);
await page.waitForURL(/\/brain$/);
await page.getByRole('tab', { name: 'Story' }).click();
await page.waitForTimeout(4000);
await page.screenshot({ path: 'checkpoints/12-story.png' });
await browser.close();
