import { launch, login, BASE } from './lib.mjs';
const [, , path = '/brain', out = 'checkpoints/shot.png', email] = process.argv;
const { browser, page } = await launch();
await login(page, email);
await page.goto(`${BASE}${path}`);
await page.waitForTimeout(4000);
await page.screenshot({ path: out, fullPage: false });
console.log('saved', out, page.url());
await browser.close();
