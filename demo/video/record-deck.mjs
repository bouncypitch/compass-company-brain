/**
 * Records the /demo deck as one continuous 1440x900 take, pacing each slide to
 * its narration clip, and writes clips/timeline.json for compose.mjs.
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { BASE, login } from '../lib.mjs';

const OUT = path.resolve('clips');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const durations = JSON.parse(fs.readFileSync('audio/durations.json', 'utf8'));
const ORDER = ['title', 'problem', 'market', 'landscape', 'convergence', 'timemachine', 'gap', 'story', 'compass', 'plan', 'ask', 'org', 'close'];
const PAD = 1.4; // seconds of breathing room after each narration clip

const browser = await chromium.launch();
const pre = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const prePage = await pre.newPage();
await login(prePage);
// Warm caches so every slide renders instantly on camera.
await prePage.goto(`${BASE}/demo?s=title`);
await prePage.waitForSelector('[data-slide="title"]', { timeout: 30000 });
await sleep(4000);
const state = await pre.storageState();
await pre.close();

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: state, recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } });
const page = await ctx.newPage();
const t0 = Date.now();
const now = () => (Date.now() - t0) / 1000;
await page.goto(`${BASE}/demo?s=title`);
await page.waitForSelector('[data-slide="title"]', { timeout: 30000 });
await sleep(2500); // let data + entrance animations settle
// Slide-index marker in the bottom-right corner (hidden by the rounded-corner mask when composited).
const setMarker = (i) => page.evaluate((idx) => {
  let el = document.getElementById('__slide_marker');
  if (!el) {
    el = document.createElement('div');
    el.id = '__slide_marker';
    el.style.cssText = 'position:fixed;right:0;bottom:0;width:16px;height:16px;z-index:2147483647;pointer-events:none';
    document.body.appendChild(el);
  }
  el.style.background = `rgb(${(idx % 4) * 80}, ${Math.floor(idx / 4) * 80}, 255)`;
}, i);
await setMarker(0);
await sleep(300);
const timeline = { trimStart: now(), slides: [] };

for (const [i, id] of ORDER.entries()) {
  if (i > 0) {
    await page.keyboard.press('ArrowRight');
    await page.waitForSelector(`[data-slide="${id}"]`, { timeout: 10000 });
    await setMarker(i);
  }
  const start = now();
  timeline.slides.push({ id, start });
  const hold = (durations[id]?.duration ?? 6) + PAD;
  const until = start + hold;

  if (id === 'gap') {
    await sleep(9000); // narration reaches "One click accepts the recommendation"
    await page.getByRole('button', { name: /Accept & draft PR/ }).click();
    await page.getByText(/Saved to brain/i).first().waitFor({ timeout: 180000 }).catch(() => {});
  }
  if (id === 'ask') {
    await sleep(1200);
    await page.getByRole('button', { name: /Who owns agent memory/ }).first().click();
    await page.getByText(/Nobody|owns|R-14/).filter({ hasNotText: 'Who owns agent memory' }).first().waitFor({ timeout: 180000 });
    timeline.askAnswerAt = now();
    console.log('  answer visible after', (now() - start).toFixed(1), 's');
  }
  if (id === 'org') {
    await sleep(5500);
    await page.locator('.react-flow__node', { hasText: 'Jordan Rivera' }).first().click().catch(() => {});
  }
  const remaining = until - now();
  if (remaining > 0) await sleep(remaining * 1000);
  console.log(`${id.padEnd(12)} ${(now() - start).toFixed(1)}s`);
}
await sleep(1500);
timeline.end = now();
const video = page.video();
await ctx.close();
fs.renameSync(await video.path(), path.join(OUT, 'deck.webm'));
fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(timeline, null, 2));
await browser.close();
console.log('total', (timeline.end - timeline.trimStart).toFixed(1) + 's');
