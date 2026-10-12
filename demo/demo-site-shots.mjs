// Screenshots every slide of the /demo keynote deck at 1440x900.
// Usage: node demo-site-shots.mjs [slideId ...]   (no args = all slides)
import { launch, login, BASE } from './lib.mjs';

const SLIDES = ['title', 'problem', 'market', 'landscape', 'convergence', 'timemachine', 'gap', 'story', 'compass', 'plan', 'ask', 'org', 'close'];
const only = new Set(process.argv.slice(2));

const { browser, page } = await launch();
await login(page);
await page.goto(`${BASE}/demo`);
await page.waitForURL(/\/demo\/[^/?]+/, { timeout: 20000 });
await page.waitForSelector('[data-slide="title"]');
// Let React Query prefetch the cached brain payloads.
await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(1500);

for (let i = 0; i < SLIDES.length; i += 1) {
  const id = SLIDES[i];
  if (i > 0) {
    await page.keyboard.press('ArrowRight');
    await page.waitForSelector(`[data-slide="${id}"]`);
  }
  if (only.size && !only.has(id)) continue;
  // Entrance animations, count-ups and React Flow fitView settle within ~2.5s.
  await page.waitForTimeout(id === 'story' || id === 'org' ? 3000 : 2400);
  const file = `checkpoints/site-${String(i + 1).padStart(2, '0')}-${id}.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);
}
await browser.close();
