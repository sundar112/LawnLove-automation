/**
 * recorded-flow.ts — Playwright Codegen output landing zone.
 *
 * This file is overwritten every time you run:
 *   npm run codegen          (as logged-in user)
 *   npm run codegen:admin    (as admin)
 *   npm run codegen:public   (no auth)
 *
 * After recording:
 *   1. Read this file to understand the exact locators the browser used
 *   2. Write the clean spec in src/tests/<feature>.spec.ts using those locators
 *   3. This file is not committed (gitignored)
 *
 * Current recording: (empty — run codegen to populate)
 */

import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Recording will be inserted here by `playwright codegen`

await browser.close();
