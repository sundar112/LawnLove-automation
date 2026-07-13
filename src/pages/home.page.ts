import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

const PAGE_TITLE = 'LawnLove — Professional Lawn Care, Booked in Minutes';

const NAV_LINKS = ['Home', 'Services', 'How it Works', 'Why us', 'Contact'];

const WHY_US_CARDS = [
  'Verified Professionals',
  'Transparent Pricing',
  'Flexible Scheduling',
  'Quality You Can Trust',
];

const HOW_IT_WORKS_STEPS = [
  'Enter your Address',
  'Outline your Lawn',
  'Schedule your visit.',
  'Relax',
];

const FAQ_QUESTIONS = [
  'How much does lawn care cost?',
  'How do I know the professionals are qualified?',
  "What if I'm not satisfied with the service?",
  'What happens if I need to reschedule?',
  'Can I schedule recurring service?',
];

const FOOTER_COLUMNS = ['Services', 'Company', 'Support'];

const SOCIAL_LINKS = ['GitHub', 'Reddit', 'Twitter', 'LinkedIn'];

export type AnchorSectionId = 'services' | 'why-us' | 'how-it-works';

export class HomePage extends BasePage {
  protected readonly path = '/';

  protected readonly readyLocator = (): Locator => this.heroHeading;

  // ── Section scopes (duplicate accessible names exist page-wide) ────────
  private readonly navbar = this.page.getByRole('banner');
  private readonly footer = this.page.getByRole('contentinfo');
  private readonly heroSection = this.page
    .locator('section')
    .filter({ has: this.page.getByRole('heading', { level: 1 }) });
  private readonly servicesSection = this.page.locator('#services');
  private readonly whyUsSection = this.page.locator('#why-us');
  private readonly howItWorksSection = this.page.locator('#how-it-works');
  private readonly beforeAfterSection = this.sectionWithHeading(
    'See the Difference Professional Lawn Care Makes',
  );
  private readonly reviewsSection = this.sectionWithHeading('Loved by Homeowners');
  private readonly faqSection = this.sectionWithHeading('Frequently Asked Questions');
  private readonly ctaSection = this.sectionWithHeading('Your Lawn Deserves Professional Care');

  // ── Navbar ──────────────────────────────────────────────────────────────
  private readonly navbarLogoLink = this.navbar.getByRole('link', { name: 'LawnLove' });
  private readonly getAQuoteLink = this.navbar.getByRole('link', { name: 'Get a Quote' });
  private readonly loginSignupLink = this.navbar.getByRole('link', { name: 'Log in / Sign up' });
  private readonly openMenuButton = this.navbar.getByRole('button', { name: 'Open menu' });
  private readonly closeMenuButton = this.navbar.getByRole('button', { name: 'Close menu' });

  // ── Hero ────────────────────────────────────────────────────────────────
  private readonly heroHeading = this.page.getByRole('heading', {
    level: 1,
    name: /Lawn Care Made Easy/,
  });
  private readonly heroBadge = this.heroSection.getByText('Trusted by 40,000+ homeowners');
  private readonly addressInput = this.heroSection.getByPlaceholder('Enter your home address');
  private readonly heroQuoteLink = this.heroSection.getByRole('link', {
    name: 'Get an Instant Quote',
  });

  // ── Before/After ────────────────────────────────────────────────────────
  private readonly comparisonSlider = this.page.getByRole('slider', {
    name: 'Before and after comparison slider',
  });
  private readonly afterLabel = this.beforeAfterSection.getByText('AFTER', { exact: true });
  private readonly beforeLabel = this.beforeAfterSection.getByText('BEFORE', { exact: true });
  private readonly bookFirstServiceLink = this.beforeAfterSection.getByRole('link', {
    name: 'Book your First Service',
  });

  // ── Reviews ─────────────────────────────────────────────────────────────
  private readonly previousReviewButton = this.reviewsSection.getByRole('button', {
    name: 'Previous review',
  });
  private readonly nextReviewButton = this.reviewsSection.getByRole('button', {
    name: 'Next review',
  });

  // ── CTA ─────────────────────────────────────────────────────────────────
  private readonly ctaSignUpLink = this.ctaSection.getByRole('link', { name: 'Sign up' });
  private readonly ctaQuoteLink = this.ctaSection.getByRole('link', {
    name: 'Get an Instant Quote',
  });

  // ── Footer ──────────────────────────────────────────────────────────────
  private readonly footerLogoLink = this.footer.getByRole('link', { name: 'LawnLove' });
  private readonly copyright = this.footer.getByText('© 2024 Lucidtech AS');

  // ── Parameterized locators ──────────────────────────────────────────────
  private sectionWithHeading(name: string): Locator {
    return this.page.locator('section').filter({ has: this.page.getByRole('heading', { name }) });
  }

  private navLink(name: string): Locator {
    return this.navbar.getByRole('link', { name, exact: true });
  }

  private faqTrigger(question: string): Locator {
    return this.faqSection.getByRole('button', { name: question });
  }

  private faqAnswer(snippet: string | RegExp): Locator {
    return this.faqSection.getByText(snippet);
  }

  private reviewByAuthor(author: string): Locator {
    return this.reviewsSection.getByText(author, { exact: true });
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  async fillAddress(address: string): Promise<void> {
    await expect(this.addressInput).toBeVisible();
    await this.addressInput.fill(address);
  }

  async clickNavLink(name: string): Promise<void> {
    await this.navLink(name).click();
  }

  async clickLoginSignup(): Promise<void> {
    await this.loginSignupLink.click();
  }

  /** The reviews section sits below the fold; bring it into the viewport first. */
  async scrollToReviews(): Promise<void> {
    await this.reviewsSection.scrollIntoViewIfNeeded();
  }

  async openMobileMenu(): Promise<void> {
    await this.openMenuButton.click();
  }

  async closeMobileMenu(): Promise<void> {
    await this.closeMenuButton.click();
  }

  async openFaqItem(question: string): Promise<void> {
    await this.faqTrigger(question).click();
  }

  async closeFaqItem(question: string): Promise<void> {
    await this.faqTrigger(question).click();
  }

  async clickNextReview(times = 1): Promise<void> {
    for (let i = 0; i < times; i += 1) {
      await this.nextReviewButton.click();
    }
  }

  async clickPreviousReview(times = 1): Promise<void> {
    for (let i = 0; i < times; i += 1) {
      await this.previousReviewButton.click();
    }
  }

  /** Each ArrowRight press moves the slider +5 (locator.press focuses first). */
  async moveSliderRight(steps = 1): Promise<void> {
    for (let i = 0; i < steps; i += 1) {
      await this.comparisonSlider.press('ArrowRight');
    }
  }

  async moveSliderLeft(steps = 1): Promise<void> {
    for (let i = 0; i < steps; i += 1) {
      await this.comparisonSlider.press('ArrowLeft');
    }
  }

  // ── Assertions ──────────────────────────────────────────────────────────
  async expectPageTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(PAGE_TITLE);
  }

  async expectNavbarVisible(): Promise<void> {
    await expect(this.navbarLogoLink).toBeVisible();
    for (const name of NAV_LINKS) {
      await expect(this.navLink(name)).toBeVisible();
    }
    await expect(this.getAQuoteLink).toBeVisible();
    await expect(this.loginSignupLink).toBeVisible();
  }

  async expectHeroVisible(): Promise<void> {
    await expect(this.heroBadge).toBeVisible();
    await expect(this.heroHeading).toBeVisible();
    await expect(this.addressInput).toBeVisible();
    await expect(this.heroQuoteLink).toBeVisible();
  }

  async expectAddressValue(value: string): Promise<void> {
    await expect(this.addressInput).toHaveValue(value);
  }

  async expectServicesVisible(): Promise<void> {
    await expect(
      this.servicesSection.getByRole('heading', {
        name: 'Everything Your Lawn Needs in One Visit',
      }),
    ).toBeVisible();
    await expect(this.servicesSection.getByText('Precision cut to the ideal height')).toBeVisible();
    await expect(this.servicesSection.getByText('The same trusted pro each time')).toBeVisible();
  }

  async expectWhyUsVisible(): Promise<void> {
    await expect(
      this.whyUsSection.getByRole('heading', { name: 'Why Homeowners Choose Us' }),
    ).toBeVisible();
    for (const card of WHY_US_CARDS) {
      await expect(this.whyUsSection.getByRole('heading', { name: card })).toBeVisible();
    }
  }

  async expectHowItWorksVisible(): Promise<void> {
    await expect(
      this.howItWorksSection.getByRole('heading', {
        name: 'Book Lawn Care in Three Simple Steps',
      }),
    ).toBeVisible();
    for (const step of HOW_IT_WORKS_STEPS) {
      await expect(
        this.howItWorksSection.getByRole('heading', { name: step, exact: true }),
      ).toBeVisible();
    }
  }

  async expectBeforeAfterVisible(): Promise<void> {
    await expect(
      this.beforeAfterSection.getByRole('heading', {
        name: 'See the Difference Professional Lawn Care Makes',
      }),
    ).toBeVisible();
    await expect(this.comparisonSlider).toBeVisible();
    await expect(this.afterLabel).toBeVisible();
    await expect(this.beforeLabel).toBeVisible();
    await expect(this.bookFirstServiceLink).toBeVisible();
  }

  async expectReviewsVisible(): Promise<void> {
    await expect(
      this.reviewsSection.getByRole('heading', { name: 'Loved by Homeowners' }),
    ).toBeVisible();
    await expect(this.previousReviewButton).toBeVisible();
    await expect(this.nextReviewButton).toBeVisible();
    await expect(this.reviewByAuthor('Michael H, Belgium')).toBeVisible();
  }

  async expectFaqVisible(): Promise<void> {
    await expect(
      this.faqSection.getByRole('heading', { name: 'Frequently Asked Questions' }),
    ).toBeVisible();
    for (const question of FAQ_QUESTIONS) {
      await expect(this.faqTrigger(question)).toBeVisible();
    }
  }

  async expectCtaVisible(): Promise<void> {
    await expect(
      this.ctaSection.getByRole('heading', { name: 'Your Lawn Deserves Professional Care' }),
    ).toBeVisible();
    await expect(this.ctaSignUpLink).toBeVisible();
    await expect(this.ctaSignUpLink).toHaveAttribute('href', '/signup');
    await expect(this.ctaQuoteLink).toBeVisible();
    await expect(this.ctaQuoteLink).toHaveAttribute('href', '#quote');
  }

  async expectFooterVisible(): Promise<void> {
    await expect(this.footerLogoLink).toBeVisible();
    for (const column of FOOTER_COLUMNS) {
      await expect(this.footer.getByRole('heading', { name: column, exact: true })).toBeVisible();
    }
    await expect(this.copyright).toBeVisible();
    for (const social of SOCIAL_LINKS) {
      await expect(this.footer.getByLabel(social)).toBeVisible();
    }
  }

  async expectFaqItemOpen(question: string, answerSnippet: string | RegExp): Promise<void> {
    await expect(this.faqTrigger(question)).toHaveAttribute('data-panel-open');
    await expect(this.faqAnswer(answerSnippet)).toBeVisible();
  }

  async expectFaqItemClosed(question: string, answerSnippet: string | RegExp): Promise<void> {
    await expect(this.faqTrigger(question)).not.toHaveAttribute('data-panel-open');
    await expect(this.faqAnswer(answerSnippet)).toBeHidden();
  }

  async expectSliderValue(value: number): Promise<void> {
    await expect(this.comparisonSlider).toHaveAttribute('aria-valuenow', String(value));
  }

  async expectReviewInViewport(author: string): Promise<void> {
    await expect(this.reviewByAuthor(author)).toBeInViewport();
  }

  async expectReviewNotInViewport(author: string): Promise<void> {
    await expect(this.reviewByAuthor(author)).not.toBeInViewport();
  }

  async expectAnchorSectionInViewport(sectionId: AnchorSectionId): Promise<void> {
    await expect(this.page.locator(`#${sectionId}`)).toBeInViewport();
  }

  async expectMobileMenuOpen(): Promise<void> {
    await expect(this.closeMenuButton).toBeVisible();
    await expect(this.loginSignupLink).toBeVisible();
  }

  async expectMobileMenuClosed(): Promise<void> {
    await expect(this.openMenuButton).toBeVisible();
    await expect(this.closeMenuButton).toBeHidden();
  }

  /** On mobile the desktop nav and CTA cluster are CSS-hidden below the xl breakpoint. */
  async expectDesktopNavHidden(): Promise<void> {
    await expect(this.navLink('Services')).toBeHidden();
    await expect(this.loginSignupLink).toBeHidden();
  }
}
