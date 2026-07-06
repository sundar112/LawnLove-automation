import { test, type Page } from '@playwright/test';
import { ExamplePage } from '../pages/example.page';

/**
 * ExamplePage spec — template starter test suite.
 *
 * Naming convention: <feature>.spec.ts in src/tests/
 * Tags: @smoke (happy path, fast) | @regression (full flow end-to-end)
 * Role tags: @as-admin | @as-user | @as-public
 *
 * Each spec gets 4 npm scripts in package.json:
 *   test:<feature>
 *   test:<feature>:headed
 *   test:<feature>:smoke
 *   test:<feature>:regression
 */

async function goToExamplePage(page: Page): Promise<ExamplePage> {
  const examplePage = new ExamplePage(page);
  await examplePage.goto();
  return examplePage;
}

test.describe('Example Feature', () => {
  test('should load the example page @smoke @as-user', async ({ page }) => {
    const examplePage = await goToExamplePage(page);
    await examplePage.waitForLoaded();
  });

  test('should submit the example form successfully @regression @as-user', async ({ page }) => {
    const examplePage = await goToExamplePage(page);
    await examplePage.fillName('Test User');
    await examplePage.submit();
    await examplePage.expectSuccessBanner();
  });
});
