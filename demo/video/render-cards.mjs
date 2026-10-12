import { chromium } from 'playwright';
import path from 'path';
const here = path.resolve('.');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const stats = process.argv[2] || '';
for (const c of ['title', 'problem', 'market', 'trust', 'act', 'people', 'graph', 'close']) {
  await page.goto(`file://${here}/cards.html?c=${c}&stats=${encodeURIComponent(stats)}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `card-${c}.png` });
}
await page.goto(`file://${here}/frame.html`); await page.screenshot({ path: 'frame-bg.png' });
const m = await browser.newPage({ viewport: { width: 1568, height: 980 } });
await m.goto(`file://${here}/mask.html`); await m.screenshot({ path: 'mask.png' });
await browser.close();
console.log('cards rendered');
