import { chromium } from 'playwright';
import path from 'path';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(`file://${path.resolve('play-thumb.html')}`);
await p.waitForTimeout(400);
await p.screenshot({ path: '../../docs/media/video-thumbnail.png' });
await b.close();
