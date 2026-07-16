import { expect, test, type Page } from '@playwright/test';
import { ForgotPasswordPage } from '../pages/forgot-password.page';
import { LoginPage } from '../pages/login.page';
import { createVerifiedAccount } from '../utils/account';
import { freshEmail, getVerificationLink } from '../utils/email';
import { retry } from '../utils/retry';

/** Endpoint hit when requesting a password reset — captured from the live app. */
const RESET_REQUEST_API = '**/api/auth/request-password-reset';

/** Reset links embed the token in the URL path — no "token" keyword. */
const RESET_LINK_PATTERN = /reset-password/i;

async function goToForgotPasswordPage(page: Page): Promise<ForgotPasswordPage> {
  const forgotPasswordPage = new ForgotPasswordPage(page);
  await forgotPasswordPage.goto();
  return forgotPasswordPage;
}

/**
 * The reset endpoint rate-limits aggressively ("Too many requests"), so
 * submits are retried with backoff — the form stays usable after the error.
 */
async function requestReset(forgotPasswordPage: ForgotPasswordPage, email: string): Promise<void> {
  await retry(
    async () => {
      await forgotPasswordPage.requestReset(email);
      await forgotPasswordPage.expectCheckEmailScreen();
    },
    { attempts: 4, baseDelayMs: 30_000, factor: 1, label: 'request-reset' },
  );
}

/**
 * The app shows the same check-email screen for any address
 * (anti-enumeration), so screen-behavior tests use a throwaway alias
 * without creating an account. Only TC-064 needs a real one.
 */
async function requestResetForFreshAlias(page: Page): Promise<ForgotPasswordPage> {
  const forgotPasswordPage = await goToForgotPasswordPage(page);
  await requestReset(forgotPasswordPage, freshEmail());
  return forgotPasswordPage;
}

// @chromium-only: shares the rate-limited auth backend with signup/login.
test.describe('Forgot password @chromium-only', () => {
  test.describe.configure({ mode: 'default' });

  test('should show the reset request form @smoke @as-public', async ({ page }) => {
    const forgotPasswordPage = await goToForgotPasswordPage(page);
    await forgotPasswordPage.expectFormVisible();
  });

  test('should navigate back to sign in @TC-070 @regression @as-public', async ({ page }) => {
    const forgotPasswordPage = await goToForgotPasswordPage(page);
    await forgotPasswordPage.clickBackToSignIn();

    const loginPage = new LoginPage(page);
    await loginPage.waitForLoaded();
    await loginPage.expectUrl(/\/login$/);
  });

  test('should send a reset email to a registered account @TC-064 @smoke @as-public', async ({
    page,
  }) => {
    test.slow(); // creates a real account, then waits for the reset email

    const account = await createVerifiedAccount(page);

    const forgotPasswordPage = await goToForgotPasswordPage(page);
    await requestReset(forgotPasswordPage, account.email);

    // The email must actually arrive, with a usable reset link.
    const resetLink = await getVerificationLink(account.email, 90_000, RESET_LINK_PATTERN);
    expect(resetLink).toContain('reset-password');
  });

  test('should show the reset-specific copy on the check-email screen @TC-065 @regression @as-public', async ({
    page,
  }) => {
    test.slow(); // rate-limit retries need headroom

    const forgotPasswordPage = await requestResetForFreshAlias(page);
    // expectCheckEmailScreen already asserts the copy; pin the countdown too.
    await forgotPasswordPage.expectResendCountdown();
  });

  test('should keep resend disabled during the countdown @TC-067 @regression @as-public', async ({
    page,
  }) => {
    test.slow(); // rate-limit retries need headroom

    const forgotPasswordPage = await requestResetForFreshAlias(page);
    await forgotPasswordPage.expectResendCountdown();
  });

  test('should send only one resend request on rapid clicks @TC-069 @regression @as-public', async ({
    page,
  }) => {
    test.slow(); // waits out the ~60s resend cooldown

    const forgotPasswordPage = await requestResetForFreshAlias(page);
    await forgotPasswordPage.waitForResendEnabled();

    let requests = 0;
    let releaseResponse!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route(RESET_REQUEST_API, async (route) => {
      requests += 1;
      await hold;
      await route.continue();
    });

    await forgotPasswordPage.rapidClickResend(3);
    releaseResponse();

    await forgotPasswordPage.expectResendCountdown(); // cooldown restarted
    expect(requests).toBe(1);
  });

  test('should survive a resend attempted while offline @TC-073 @regression @as-public', async ({
    page,
    context,
  }) => {
    test.slow(); // waits out the ~60s resend cooldown

    const forgotPasswordPage = await requestResetForFreshAlias(page);
    await forgotPasswordPage.waitForResendEnabled();

    await context.setOffline(true);
    await forgotPasswordPage.clickResend();
    // State must not be corrupted: still on the check-email screen.
    await forgotPasswordPage.expectCheckEmailScreen();

    // Back online, the resend control recovers (a working resend is TC-069's job).
    await context.setOffline(false);
    await forgotPasswordPage.waitForResendEnabled();
  });
});
