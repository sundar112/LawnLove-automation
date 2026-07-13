import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { TIMEOUTS } from './src/config/timeouts';
import { type RoleKey } from './src/config/roles';

const storagePath = (role: RoleKey): string => `auth/${role}.storage.json`;

/**
 * Project filtering convention:
 *   - `chromium-<role>`  runs only tests tagged `@as-<role>`
 *   - `chromium-public`  runs only tests tagged `@as-public` (e.g. login, register)
 *   - The `setup` project runs auth.setup.ts before every role project.
 *
 * To add a role: extend roles.ts, add credentials to .env.example + .env,
 * add a persona in fixtures/personas.ts, and add a project entry below.
 */
export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: env.RETRIES,
  workers: env.WORKERS,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'reports/playwright-report/results.json' }],
  ],
  outputDir: 'reports/test-artifacts',
  timeout: TIMEOUTS.testTimeoutMs,
  expect: {
    timeout: env.EXPECT_TIMEOUT_MS,
  },
  use: {
    baseURL: env.BASE_URL,
    headless: env.HEADLESS,
    actionTimeout: env.DEFAULT_TIMEOUT_MS,
    navigationTimeout: env.NAVIGATION_TIMEOUT_MS,
    trace: env.TRACE,
    video: env.VIDEO,
    screenshot: env.SCREENSHOT,
    launchOptions: {
      slowMo: env.SLOW_MO,
    },
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  projects: [
    // ── Auth setup — runs before role projects ───────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // ── Role projects ────────────────────────────────────────────────────
    {
      name: 'chromium-admin',
      testIgnore: /auth\.setup\.ts/,
      grep: /@as-admin\b/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: storagePath('admin'),
      },
    },
    {
      name: 'chromium-user',
      testIgnore: /auth\.setup\.ts/,
      grep: /@as-user\b/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: storagePath('user'),
      },
    },
    {
      name: 'chromium-public',
      testIgnore: /auth\.setup\.ts/,
      grep: /@as-public\b/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // ── Cross-browser (public flows only for now) ────────────────────────
    // Logged-in flows stay Chromium-only; storageState files are browser-
    // independent, so copying these blocks with storagePath('<role>') is all
    // it takes to extend a role to another browser.
    {
      name: 'firefox-public',
      testIgnore: /auth\.setup\.ts/,
      grep: /@as-public\b/,
      grepInvert: /@chromium-only\b/,
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit-public',
      testIgnore: /auth\.setup\.ts/,
      grep: /@as-public\b/,
      grepInvert: /@chromium-only\b/,
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
});
