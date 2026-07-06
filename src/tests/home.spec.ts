import { test, type Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';

const FAQ_QUESTION = 'How much does lawn care cost?';
const FAQ_ANSWER_SNIPPET = /upfront quote/;
const FIRST_REVIEW_AUTHOR = 'Michael H, Belgium';

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

  test('should have the correct page title @smoke @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectPageTitle();
  });

  test('should display the hero section @smoke @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectHeroVisible();
  });

  test('should display the navbar links and CTAs @smoke @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectNavbarVisible();
  });

  test('should render all landing page sections @regression @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectServicesVisible();
    await homePage.expectWhyUsVisible();
    await homePage.expectHowItWorksVisible();
    await homePage.expectBeforeAfterVisible();
    await homePage.expectReviewsVisible();
    await homePage.expectFaqVisible();
    await homePage.expectCtaVisible();
  });

  test('should display footer columns, copyright and social links @regression @as-public', async ({
    page,
  }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectFooterVisible();
  });

  test('should accept text in the hero address field @regression @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.fillAddress('123 Greenway Ave');
    await homePage.expectAddressValue('123 Greenway Ave');
  });

  test('should navigate to sections via navbar anchor links @regression @as-public', async ({
    page,
  }) => {
    const homePage = await goToHomePage(page);

    await homePage.clickNavLink('Services');
    await homePage.expectUrl(/#services$/);
    await homePage.expectAnchorSectionInViewport('services');

    await homePage.clickNavLink('How it Works');
    await homePage.expectUrl(/#how-it-works$/);
    await homePage.expectAnchorSectionInViewport('how-it-works');

    await homePage.clickNavLink('Why us');
    await homePage.expectUrl(/#why-us$/);
    await homePage.expectAnchorSectionInViewport('why-us');
  });

  test('should expand and collapse a FAQ item @regression @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectFaqItemClosed(FAQ_QUESTION, FAQ_ANSWER_SNIPPET);
    await homePage.openFaqItem(FAQ_QUESTION);
    await homePage.expectFaqItemOpen(FAQ_QUESTION, FAQ_ANSWER_SNIPPET);
    await homePage.closeFaqItem(FAQ_QUESTION);
    await homePage.expectFaqItemClosed(FAQ_QUESTION, FAQ_ANSWER_SNIPPET);
  });

  test('should scroll the reviews carousel with next and previous buttons @regression @as-public', async ({
    page,
  }) => {
    const homePage = await goToHomePage(page);
    await homePage.scrollToReviews();
    await homePage.expectReviewInViewport(FIRST_REVIEW_AUTHOR);
    await homePage.clickNextReview(2);
    await homePage.expectReviewNotInViewport(FIRST_REVIEW_AUTHOR);
    await homePage.clickPreviousReview(2);
    await homePage.expectReviewInViewport(FIRST_REVIEW_AUTHOR);
  });

  test('should move the before/after slider with arrow keys @regression @as-public', async ({
    page,
  }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectSliderValue(50);
    await homePage.moveSliderRight(2);
    await homePage.expectSliderValue(60);
    await homePage.moveSliderLeft(1);
    await homePage.expectSliderValue(55);
  });
});

test.describe('Home — mobile', () => {
  // Below the xl (1280px) breakpoint the navbar collapses into a hamburger menu.
  test.use({ viewport: { width: 390, height: 844 } });

  test('should show the hamburger and hide desktop nav on mobile @regression @as-public', async ({
    page,
  }) => {
    const homePage = await goToHomePage(page);
    await homePage.expectMobileMenuClosed();
    await homePage.expectDesktopNavHidden();
  });

  test('should open and close the mobile menu @regression @as-public', async ({ page }) => {
    const homePage = await goToHomePage(page);
    await homePage.openMobileMenu();
    await homePage.expectMobileMenuOpen();
    await homePage.closeMobileMenu();
    await homePage.expectMobileMenuClosed();
  });

  test('should navigate via a mobile menu link and close the panel @regression @as-public', async ({
    page,
  }) => {
    const homePage = await goToHomePage(page);
    await homePage.openMobileMenu();
    await homePage.clickNavLink('Services');
    await homePage.expectUrl(/#services$/);
    await homePage.expectMobileMenuClosed();
    await homePage.expectAnchorSectionInViewport('services');
  });
});
