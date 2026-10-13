import { chromium } from 'playwright';
import path from 'path';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await p.goto(`file://${path.resolve('yt-thumb.html')}`);
await p.waitForTimeout(300);
await p.screenshot({ path: '../../docs/media/youtube-thumbnail.png' });
await b.close();
