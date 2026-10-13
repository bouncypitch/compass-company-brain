import { chromium } from 'playwright';
import path from 'path';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
await p.goto(`file://${path.resolve('social.html')}`);
await p.waitForTimeout(300);
await p.screenshot({ path: '../../docs/media/social-preview.png' });
await b.close();
