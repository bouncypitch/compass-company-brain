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
const ORDER = ['title', 'example', 'problem', 'market', 'landscape', 'convergence', 'timemachine', 'gap', 'story', 'compass', 'plan', 'ask', 'keynote', 'keynote2', 'live', 'live2', 'org', 'close'];
// Steps that are not deck slides: same page state (keynote2, live2) or the real app (live*).
const VIRTUAL = new Set(['keynote2', 'live', 'live2']);
const ORG = 'feccc495-f539-4650-ac3a-1bdf9f066056';
const QUOTE = { file: 'audio/keynote-quote.mp3', seconds: 17.6 };
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
  el.style.background = `rgb(${(idx % 5) * 60}, ${Math.floor(idx / 5) * 60}, 255)`;
}, i);
await setMarker(0);
await sleep(300);
const timeline = { trimStart: now(), slides: [], cues: [] };

for (const [i, id] of ORDER.entries()) {
  if (id === 'live') {
    await page.goto(`${BASE}/organizations/${ORG}/brain`);
    await page.getByText('Competitive landscape').waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: 'Accept All' }).click({ timeout: 1500 }).catch(() => {});
    await setMarker(i);
  } else if (id === 'org') {
    await page.goto(`${BASE}/demo/${ORG}?s=org`);
    await page.waitForSelector('[data-slide="org"]', { timeout: 30000 });
    await sleep(800);
    await setMarker(i);
  } else if (VIRTUAL.has(id)) {
    await setMarker(i);
  } else if (i > 0) {
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
  if (id === 'keynote') {
    await sleep(1200);
    await page.getByRole('button', { name: /keynote say a company brain/ }).first().click();
    await page.getByRole('button', { name: /Play talk clip/ }).first().waitFor({ timeout: 180000 });
    const narrationEnd = start + 0.5 + (durations.keynote?.duration ?? 10) + 0.4;
    if (narrationEnd > now()) await sleep((narrationEnd - now()) * 1000);
    await page.getByRole('button', { name: /Play talk clip/ }).first().click().catch(() => {});
    timeline.cues.push({ slideId: 'keynote', wallAt: now(), file: QUOTE.file });
    await sleep(QUOTE.seconds * 1000 + 600);
    console.log(`${id.padEnd(12)} ${(now() - start).toFixed(1)}s`);
    continue;
  }
  if (id === 'live') {
    const scrollBy = async (dy, ms = 1400) => { for (let k = 0; k < ms / 16; k++) { await page.mouse.wheel(0, dy / (ms / 16)); await sleep(16); } };
    await sleep(2200);
    await scrollBy(560);
    await sleep(1500);
    await page.locator('button[aria-label*="Codebase memory"]').filter({ hasText: /\d/ }).first().click().catch(() => {});
    await sleep(2500);
    const gaps = page.getByText('What Forgeline should do').first();
    await gaps.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(1500);
    await page.getByRole('button', { name: /Accept & draft PR/ }).first().click().catch(() => {});
    await page.getByText(/Saved back to the brain/i).first().waitFor({ timeout: 120000 }).catch(() => {});
    await sleep(800);
    await page.getByText(/Saved back to the brain/i).first().scrollIntoViewIfNeeded().catch(() => {});
    await scrollBy(250, 900);
    await sleep(3500);
    console.log(`${id.padEnd(12)} ${(now() - start).toFixed(1)}s`);
    continue;
  }
  if (id === 'live2') {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(800);
    await page.getByRole('tab', { name: 'Compass' }).click();
    await page.getByText('Where you stand', { exact: false }).first().waitFor({ timeout: 60000 }).catch(() => {});
    await sleep(4500);
    await page.getByRole('tab', { name: 'Org map' }).click();
    await page.getByText('relationships').first().waitFor({ timeout: 30000 }).catch(() => {});
    await sleep(1500);
    await page.mouse.wheel(0, 380);
    await sleep(1200);
    await page.locator('.react-flow__node', { hasText: 'Jordan Rivera' }).first().click().catch(() => {});
    await sleep(4500);
    console.log(`${id.padEnd(12)} ${(now() - start).toFixed(1)}s`);
    continue;
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
