import { test, type Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';

async function goToHomePage(page: Page): Promise<HomePage> {
  const homePage = new HomePage(page);
  await homePage.goto();
  return homePage;
}

test.describe('Home', () => {
  test('should open the website homepage @smoke @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectUrl(/\/$/);
  });
});
