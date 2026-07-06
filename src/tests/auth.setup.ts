import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ROLES } from '../config/roles';
import { personaFor } from '../fixtures/personas';
import { childLogger } from '../utils/logger';

const log = childLogger('auth.setup');

/**
 * Setup project — runs once before all real tests.
 *
 * For each role it:
 *   1. Navigates to the login page
 *   2. Fills credentials from .env
 *   3. Waits for successful redirect
 *   4. Saves the full browser storageState to auth/<role>.storage.json
 *
 * Test projects load that file via `use.storageState`, so non-login tests
 * start already authenticated without going through the login UI again.
 *
 * Adapt the login flow below to match your app's actual login page structure.
 */

setup('site reachable', async ({ page }) => {
  const response = await page.goto('/login');
  expect(
    response?.ok() ?? false,
    'Login page unreachable — check BASE_URL in .env and that the site is up',
  ).toBe(true);
});

for (const role of ROLES) {
  const persona = personaFor(role);
  if (!persona) continue; // skip roles whose credentials are not set in .env

  setup(`authenticate as ${role}`, async ({ page, baseURL }) => {
    expect(baseURL, 'baseURL must be configured in playwright.config.ts').toBeTruthy();

    log.info({ role }, 'authenticating');

    // ── Adapt this block to your app's login UI ──────────────────────────
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(persona.email);
    await page.getByLabel(/password/i).fill(persona.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait until the app redirects away from the login page after success.
    // Replace this URL pattern with whatever your app navigates to post-login.
    await page.waitForURL(/\/(dashboard|home|app)/, { timeout: 30_000 });
    // ────────────────────────────────────────────────────────────────────

    const filePath = `auth/${role}.storage.json`;
    await mkdir(dirname(filePath), { recursive: true });
    await page.context().storageState({ path: filePath });

    log.info({ role, filePath }, 'storageState written');
  });
}
