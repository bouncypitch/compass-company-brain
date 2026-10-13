// Walks /journey at 1440x900 and saves one checkpoint per step.
// Usage (from demo/): node journey-shots.mjs
import { launch, login, BASE } from './lib.mjs';

const STEPS = [
  { id: 'standing', next: 'Next: Why now' },
  { id: 'market', next: 'Next: The pattern' },
  { id: 'converge', next: 'Next: Your opportunity' },
  { id: 'opportunity', next: 'Next: Make it yours' },
  { id: 'claim', next: 'Next: Your 90 days' },
  { id: 'plan', next: 'Next: Who to talk to' },
  { id: 'people', next: 'Next: The big picture' },
  { id: 'done', next: null },
];

const pad = (n) => String(n).padStart(2, '0');
const { browser, page } = await launch();
await login(page);
await page.goto(`${BASE}/journey`);
await page.waitForURL(/\/journey\/[^/?]+/);
const chip = page.getByRole('button', { name: 'How do I get promoted to Staff?' });
await chip.waitFor({ timeout: 20000 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'checkpoints/journey-00-ask.png' });
await chip.click();
await page.waitForTimeout(1300);
await page.screenshot({ path: 'checkpoints/journey-00-thinking.png' });
await page.locator('[data-step="standing"]').waitFor({ timeout: 20000 });

for (const [i, step] of STEPS.entries()) {
  await page.waitForFunction(
    (id) => document.querySelector('[data-current-step]')?.getAttribute('data-current-step') === id,
    step.id,
    { timeout: 10000 },
  );
  await page.waitForTimeout(1800);
  if (step.id === 'market') {
    // Hover a codebase-memory cell to show the signal popover.
    await page.getByRole('gridcell', { name: /^GitHub Copilot, Codebase memory/ }).hover();
    await page.waitForTimeout(500);
  }
  if (step.id === 'claim') {
    await page.screenshot({ path: `checkpoints/journey-${pad(i + 1)}-${step.id}-before.png` });
    await page.getByRole('button', { name: /^Claim R-14 & draft the PR/ }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `checkpoints/journey-${pad(i + 1)}-${step.id}-progress.png` });
    await page.getByRole('tablist', { name: 'Changed files' }).waitFor({ timeout: 60000 });
    await page.waitForTimeout(1200);
  }
  if (step.id === 'people') {
    await page.screenshot({ path: `checkpoints/journey-${pad(i + 1)}-${step.id}-list.png` });
    await page.getByRole('button', { name: /^Sam Okafor/ }).click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `checkpoints/journey-${pad(i + 1)}-${step.id}.png` });
  if (step.next) await page.getByRole('button', { name: step.next }).click();
}

await browser.close();
console.log('ok');
