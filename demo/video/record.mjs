/**
 * Records each product scene as its own clip (1440x900 webm) and logs "cut"
 * marks (seconds from clip start) where waits on live API calls should be trimmed.
 *   node record.mjs radar timemachine accept compass story ask org
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { BASE, login } from '../lib.mjs';

const OUT = path.resolve('clips');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, dy, ms = 1200) {
  const steps = Math.max(1, Math.round(ms / 16));
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await sleep(16);
  }
}
async function scrollTo(page, text, offset = -110, ms = 1200) {
  const el = page.getByText(text, { exact: false }).first();
  const box = await el.boundingBox();
  if (box) await smoothScroll(page, box.y + offset, ms);
}
async function openTab(page, name) {
  await page.getByRole('tab', { name }).click();
  await sleep(500);
}
async function typeSlow(page, locator, text, delay = 38) {
  await locator.click();
  for (const ch of text) await locator.press(ch === ' ' ? 'Space' : ch).catch(() => locator.type(ch));
  await sleep(delay);
}

const SCENES = {
  async radar(page) {
    await page.getByText('Competitive landscape').waitFor({ timeout: 30000 });
    await sleep(3500);
    await scrollTo(page, 'Competitive landscape', -90, 1800);
    await sleep(2500);
    const cell = page.locator('button[aria-label*="Codebase memory"]').filter({ hasText: /\d/ }).first();
    await cell.hover(); await sleep(700); await cell.click(); await sleep(3500);
    await scrollTo(page, 'Industry patterns', -90, 1600);
    await sleep(4500);
    await scrollTo(page, 'Competitor moves', -90, 1600);
    await sleep(5000);
    await smoothScroll(page, 600, 2000);
    await sleep(3500);
  },
  async timemachine(page, mark) {
    await page.getByText('Competitive landscape').waitFor({ timeout: 30000 });
    await sleep(1200);
    await page.getByRole('button', { name: /Time machine/ }).click();
    mark('click');
    await page.getByText('What actually shipped', { exact: false }).first().waitFor({ timeout: 300000 });
    mark('ready');
    await sleep(800);
    await scrollTo(page, 'What actually shipped', -160, 1600);
    await sleep(9000);
    await smoothScroll(page, 350, 1500);
    await sleep(6000);
  },
  async accept(page, mark) {
    await page.getByText('Competitive landscape').waitFor({ timeout: 30000 });
    await scrollTo(page, 'What Forgeline should do', -90, 2200);
    await sleep(5000);
    await page.getByRole('button', { name: /Accept & draft PR/ }).first().click();
    mark('click');
    await page.getByText(/HydraDB indexing|Saved back to the brain/i).first().waitFor({ timeout: 400000 });
    mark('ready');
    await sleep(1500);
    await scrollTo(page, 'Saved back to the brain', -260, 1400);
    await sleep(4000);
    await smoothScroll(page, 500, 2500);
    await sleep(5000);
  },
  async compass(page) {
    await openTab(page, 'Compass');
    await page.getByText('Where you stand', { exact: false }).waitFor({ timeout: 300000 });
    await sleep(6500);
    await scrollTo(page, 'Where you stand', -90, 1800);
    await sleep(6000);
    await scrollTo(page, 'promotion bets', -90, 1800);
    await sleep(8000);
    await smoothScroll(page, 650, 2000);
    await sleep(6000);
  },
  async story(page) {
    await openTab(page, 'Story');
    await sleep(9000);
    const gap = page.locator('.react-flow__node', { hasText: /UNOWNED/ }).first();
    if (await gap.isVisible().catch(() => false)) { await gap.click(); await sleep(5000); }
    await sleep(3000);
  },
  async ask(page, mark) {
    await openTab(page, 'Ask');
    await sleep(1500);
    const input = page.locator('#brain-ask');
    await input.click();
    await input.pressSequentially('Who owns agent memory, and what is blocked on it?', { delay: 45 });
    await sleep(600);
    await input.press('Enter');
    mark('click');
    await page.getByText('HydraDB graph paths').first().waitFor({ timeout: 300000 });
    mark('ready');
    await sleep(9000);
    await smoothScroll(page, 450, 2000);
    await sleep(6000);
  },
  async org(page) {
    await openTab(page, 'Org map');
    await page.getByText('relationships').waitFor({ timeout: 30000 });
    await sleep(4000);
    await smoothScroll(page, 380, 1500);
    await sleep(3000);
    await page.locator('.react-flow__node', { hasText: 'Jordan Rivera' }).first().click();
    await sleep(7000);
    await page.getByRole('button', { name: 'Clear focus' }).click();
    await sleep(2000);
    await page.locator('.react-flow__node', { hasText: 'R-14' }).first().click();
    await sleep(7000);
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
const browser = await chromium.launch();
const marksFile = path.join(OUT, 'marks.json');
const marks = fs.existsSync(marksFile) ? JSON.parse(fs.readFileSync(marksFile, 'utf8')) : {};
for (const name of wanted) {
  // Log in outside the recording, then reuse the storage state in a recorded context.
  const pre = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const prePage = await pre.newPage();
  await login(prePage);
  const state = await pre.storageState();
  await pre.close();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: state, recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const sceneMarks = {};
  await page.goto(`${BASE}/brain`);
  await page.waitForURL(/\/brain$/);
  await page.getByText('Compass').first().waitFor();
  await sleep(1200);
  sceneMarks.loaded = (Date.now() - t0) / 1000;
  try {
    await SCENES[name](page, (label) => { sceneMarks[label] = (Date.now() - t0) / 1000; });
  } catch (err) {
    console.error(`scene ${name} failed:`, err.message);
  }
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  fs.renameSync(src, path.join(OUT, `${name}.webm`));
  marks[name] = sceneMarks;
  console.log(`recorded ${name}`, sceneMarks);
}
fs.writeFileSync(marksFile, JSON.stringify(marks, null, 2));
await browser.close();
