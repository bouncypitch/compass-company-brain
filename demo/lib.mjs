import { chromium } from 'playwright';

export const BASE = 'http://localhost:3000';

/** Launch a 1440x900 browser; optionally record video to demo/clips. */
export async function launch({ record = false, headless = true } = {}) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ...(record ? { recordVideo: { dir: 'clips', size: { width: 1440, height: 900 } } } : {}),
  });
  const page = await context.newPage();
  return { browser, context, page };
}

export async function login(page, email = 'member@example.com') {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  // Prefer the password mode of the login form.
  const pwToggle = page.getByRole('button', { name: /password/i }).first();
  if (await pwToggle.isVisible().catch(() => false)) await pwToggle.click();
  await page.getByPlaceholder('you@example.com').last().fill(email);
  await page.getByPlaceholder('Enter your password').fill('Password123!');
  await page.getByPlaceholder('Enter your password').press('Enter');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await dismissCookies(page);
}

export async function dismissCookies(page) {
  const accept = page.getByRole('button', { name: 'Accept All' });
  if (await accept.isVisible().catch(() => false)) await accept.click();
}
