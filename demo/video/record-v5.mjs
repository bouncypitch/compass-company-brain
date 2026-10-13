/**
 * v4: Jordan's perspective. Title → keynote search (Dave's audio) → Jordan's journey with
 * live hovering, clicking and dragging. One continuous take with slide markers for drift-proof sync.
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { BASE, login } from '../lib.mjs';

const OUT = path.resolve('clips');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const AUDIO_DIR = process.env.AUDIO_DIR || 'audio-v5';
const durations = JSON.parse(fs.readFileSync(`${AUDIO_DIR}/durations.json`, 'utf8'));
const ORG = 'feccc495-f539-4650-ac3a-1bdf9f066056';
const ORDER = ['title', 'brain', 'keynote', 'keynote2', 'ask', 'standing', 'market', 'converge', 'validate', 'opportunity', 'claim', 'plan', 'people', 'graph', 'done'];
const QUOTE = { file: 'audio/keynote-quote.mp3', seconds: 17.6 };
const dur = (id) => durations[id]?.duration ?? 6;

const browser = await chromium.launch();
const pre = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const prePage = await pre.newPage();
await login(prePage, 'jordan@forgeline.dev');
for (const url of [`/demo?s=title`, `/journey`]) { await prePage.goto(`${BASE}${url}`); await sleep(3500); }
const state = await pre.storageState();
await pre.close();

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: state, recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } });
const page = await ctx.newPage();
const t0 = Date.now();
const now = () => (Date.now() - t0) / 1000;
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
const timeline = { slides: [], cues: [] };
const begin = async (id) => {
  await setMarker(ORDER.indexOf(id));
  const start = now();
  timeline.slides.push({ id, start });
  return start;
};
const holdUntil = async (t) => { const r = t - now(); if (r > 0) await sleep(r * 1000); };
const next = async (label, step) => {
  await page.getByRole('button', { name: label }).first().click();
  await page.locator(`[data-current-step="${step}"]`).first().waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(700);
};
const glide = async (locator, steps = 25) => {
  const box = await locator.boundingBox().catch(() => null);
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
};

// 1. Title
await page.goto(`${BASE}/demo/${ORG}?s=title`);
await page.waitForSelector('[data-slide="title"]', { timeout: 30000 });
await sleep(2000);
await setMarker(0);
await sleep(300);
timeline.trimStart = now();
let s = await begin('title');
await holdUntil(s + dur('title') + 1.2);

// 1b. How the brain is built (scattered sources converge into one brain)
await page.goto(`${BASE}/demo/${ORG}?s=problem`);
await page.waitForSelector('[data-slide="problem"]', { timeout: 30000 });
await sleep(300);
s = await begin('brain');
await holdUntil(s + 0.5 + dur('brain') + 1.0);

// 2. Keynote search: Compass finds the moment, Dave's voice plays
await page.goto(`${BASE}/demo/${ORG}?s=keynote`);
await page.waitForSelector('[data-slide="keynote"]', { timeout: 30000 });
await sleep(600);
s = await begin('keynote');
await sleep(2200);
await page.getByRole('button', { name: /keynote say a company brain/ }).first().click();
await page.getByRole('button', { name: /Play talk clip/ }).first().waitFor({ timeout: 120000 });
await holdUntil(s + 0.5 + dur('keynote') + 1.6);
await glide(page.getByRole('button', { name: /Play talk clip/ }).first());
await page.getByRole('button', { name: /Play talk clip/ }).first().click().catch(() => {});
timeline.cues.push({ slideId: 'keynote', wallAt: now(), file: QUOTE.file });
await sleep(QUOTE.seconds * 1000 + 500);
s = await begin('keynote2');
await holdUntil(s + dur('keynote2') + 1.0);

// 3. Jordan asks
await page.goto(`${BASE}/journey/${ORG}`);
await page.locator('[data-current-step="ask"]').first().waitFor({ timeout: 30000 }).catch(() => {});
await sleep(800);
s = await begin('ask');
await sleep(Math.max(0, (dur('ask') - 2.6)) * 1000);
await glide(page.getByRole('button', { name: 'How do I get promoted to Staff?' }));
await page.getByRole('button', { name: 'How do I get promoted to Staff?' }).click();
await page.locator('[data-current-step="standing"]').first().waitFor({ timeout: 30000 });
await sleep(900);

// 4. Where you stand
s = await begin('standing');
await sleep(4000);
for (const row of ['Technical leadership', 'Impact', 'Mentoring']) { await glide(page.getByText(row, { exact: true }).first(), 18); await sleep(1600); }
await holdUntil(s + 0.5 + dur('standing') + 1.2);

// 5. Market heatmap with hover popovers
await next(/Next: Why now/, 'market');
s = await begin('market');
await sleep(4500);
for (const name of [/GitHub Copilot, Codebase memory/, /Cursor, Background agents/, /Cognition, Enterprise/]) {
  const cell = page.getByRole('gridcell', { name }).first();
  await glide(cell, 20);
  await sleep(2400);
}
await holdUntil(s + 0.5 + dur('market') + 1.2);

// 6. Convergence + it called it
await next(/Next: The pattern/, 'converge');
s = await begin('converge');
await holdUntil(s + 0.5 + dur('converge') + 1.5);

// 6b. Validation: predictions from pre-Aug-1 data vs what shipped after
await page.goto(`${BASE}/demo/${ORG}?s=timemachine`);
await page.waitForSelector('[data-slide="timemachine"]', { timeout: 30000 });
await sleep(400);
s = await begin('validate');
await holdUntil(s + 0.5 + dur('validate') + 1.5);

// 7. Opportunity
await page.goto(`${BASE}/journey/${ORG}?step=opportunity`);
await page.locator('[data-current-step="opportunity"]').first().waitFor({ timeout: 30000 }).catch(() => {});
await sleep(700);
s = await begin('opportunity');
await holdUntil(s + 0.5 + dur('opportunity') + 1.2);

// 8. Claim & draft the PR
await next(/Next: Make it yours/, 'claim');
s = await begin('claim');
await sleep(2600);
await glide(page.getByRole('button', { name: /Claim R-14 & draft the PR/ }));
await page.getByRole('button', { name: /Claim R-14 & draft the PR/ }).click();
await page.getByRole('tablist', { name: /Changed files/ }).first().waitFor({ timeout: 120000 }).catch(() => {});
await sleep(2200);
const tabs = page.getByRole('tablist', { name: /Changed files/ }).getByRole('tab');
if ((await tabs.count().catch(() => 0)) > 1) { await glide(tabs.nth(1)); await tabs.nth(1).click(); await sleep(2200); }
await holdUntil(Math.max(s + 0.5 + dur('claim') + 1.2, now() + 1.5));

// 9. 90-day plan
await next(/Next: Your 90 days/, 'plan');
s = await begin('plan');
await holdUntil(s + 0.5 + dur('plan') + 1.5);

// 10. Who to talk to: click people, drag the graph
await next(/Next: Who to talk to/, 'people');
s = await begin('people');
await sleep(2200);
for (const who of ['Priya Shah', 'Sam Okafor', 'Grace Liu']) {
  const node = page.locator('.react-flow__node', { hasText: who }).first();
  await glide(node, 22);
  await node.click().catch(() => {});
  await sleep(2600);
}
const drag = page.locator('.react-flow__node', { hasText: 'Lena Park' }).first();
const box = await drag.boundingBox().catch(() => null);
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 - 90, { steps: 30 });
  await page.mouse.up();
}
await holdUntil(s + 0.5 + dur('people') + 2.0);

// 11. Company graph: zoom from the whole company to a team, a person, a roadmap item
await page.goto(`${BASE}/organizations/${ORG}/brain`);
await page.getByRole('tab', { name: 'Org map' }).waitFor({ timeout: 30000 });
await page.getByRole('tab', { name: 'Org map' }).click();
await page.getByText('relationships').first().waitFor({ timeout: 30000 });
await page.getByRole('button', { name: 'Conversations & customers' }).click().catch(() => {});
await sleep(600);
await page.evaluate(() => {
  const el = document.querySelector('.react-flow');
  if (el) window.scrollBy({ top: el.getBoundingClientRect().top - 96, behavior: 'smooth' });
});
await sleep(1200);
s = await begin('graph');
const focus = async (text, at) => {
  await holdUntil(s + at);
  const node = page.locator('.react-flow__node', { hasText: text }).first();
  await glide(node, 22);
  await node.click().catch(() => {});
};
await focus('Platform Eng', 8.5);
await focus('Jordan Rivera', 14.5);
await holdUntil(s + 19.5);
await page.getByRole('button', { name: 'Clear focus' }).click().catch(() => {});
await sleep(900);
await focus('R-14: Agent memory', 21.0);
await holdUntil(s + 0.5 + dur('graph') + 2.0);

// 12. Done
await page.goto(`${BASE}/journey/${ORG}?step=done`);
await page.locator('[data-current-step="done"]').first().waitFor({ timeout: 30000 }).catch(() => {});
await sleep(600);
s = await begin('done');
await holdUntil(s + 0.5 + dur('done') + 2.0);

timeline.end = now();
const video = page.video();
await ctx.close();
fs.renameSync(await video.path(), path.join(OUT, 'v5.webm'));
fs.writeFileSync(path.join(OUT, 'timeline-v5.json'), JSON.stringify(timeline, null, 2));
await browser.close();
console.log('recorded', (timeline.end - timeline.trimStart).toFixed(1) + 's', timeline.slides.map((x) => `${x.id}@${x.start.toFixed(0)}`).join(' '));
