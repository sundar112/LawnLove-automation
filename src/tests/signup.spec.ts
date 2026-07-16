import { expect, test, type Page } from '@playwright/test';
import { env } from '../config/env';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { SetPasswordPage, SignupPage } from '../pages/signup.page';
import { freshEmail, getVerificationLink } from '../utils/email';
import { retry } from '../utils/retry';
import { testRunId } from '../utils/unique';

const FULL_NAME = 'Automation Test';

const INVALID_EMAILS = ['anit@', 'anitsharma@gmailcom', 'plainaddress'];

/** The signup endpoint (better-auth magic link) — captured from the live app. */
const SIGNUP_API = '**/api/auth/sign-in/magic-link';

/** Endpoint hit when submitting the set-password form. */
const SET_PASSWORD_API = '**/auth/set-password';

/** Passwords violating the 8-64 + upper/lower/number/special policy. */
const INVALID_PASSWORDS = [
  'Pass12!', // 7 chars — below minimum
  'password', // letters only
  '12345678', // numbers only
  'Password1', // no special character
  `Aa1!${'x'.repeat(61)}`, // 65 chars — above maximum
];

/**
 * Straight to the check-email screen (direct /signup goto — nav is covered
 * elsewhere). The backend briefly rate-limits signup bursts, so failed
 * submits are retried with backoff — the form re-enables after an error.
 */
async function signUpToCheckEmail(page: Page): Promise<{ signupPage: SignupPage; email: string }> {
  const email = freshEmail();
  const signupPage = new SignupPage(page);
  await signupPage.goto();
  await signupPage.fillFullName(FULL_NAME);
  await signupPage.fillEmail(email);
  await retry(
    async () => {
      await signupPage.submit();
      await signupPage.expectCheckEmailScreen();
    },
    { attempts: 3, baseDelayMs: 10_000, factor: 1, label: 'signup-submit' },
  );
  return { signupPage, email };
}

/** Full path to a fresh set-password screen via a real magic link. */
async function completeSignupToSetPassword(
  page: Page,
): Promise<{ setPasswordPage: SetPasswordPage; link: string }> {
  const { email } = await signUpToCheckEmail(page);
  const link = await getVerificationLink(email);
  const setPasswordPage = new SetPasswordPage(page);
  await setPasswordPage.openMagicLink(link);
  return { setPasswordPage, link };
}

async function goToSignupPage(page: Page): Promise<SignupPage> {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.clickLoginSignup();

  const loginPage = new LoginPage(page);
  await loginPage.waitForLoaded();
  await loginPage.clickSignUpLink();

  const signupPage = new SignupPage(page);
  await signupPage.waitForLoaded();
  return signupPage;
}

// @chromium-only: each run creates a real user + email; no need to repeat per browser.
test.describe('Signup @chromium-only', () => {
  test('should open the signup form from the homepage @smoke @as-public', async ({ page }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.expectUrl(/\/signup$/);
    await signupPage.expectFormVisible();
  });

  test('should show the check-your-email screen after submitting @TC-001 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.signUp(FULL_NAME, freshEmail());
    await signupPage.expectCheckEmailScreen();
  });

  // The form gates invalid input by disabling Sign up — there is no
  // "submit and see errors" path for empty/invalid fields.
  test('should keep Sign up disabled until the form is complete @TC-002 @TC-003 @TC-011 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.expectSubmitDisabled();

    await signupPage.fillFullName(FULL_NAME);
    await signupPage.expectSubmitDisabled();

    await signupPage.fillEmail(freshEmail());
    await signupPage.expectSubmitEnabled();
  });

  test('should keep Sign up disabled for invalid email formats @TC-004 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName(FULL_NAME);

    for (const invalidEmail of INVALID_EMAILS) {
      await signupPage.fillEmail(invalidEmail);
      await signupPage.expectSubmitDisabled();
    }
  });

  test('should show a name error for a whitespace-only name @TC-008 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName('   ');
    await signupPage.fillEmail(freshEmail());
    await signupPage.expectNameError();
    await signupPage.expectSubmitDisabled();
  });

  test('should show a name error for special characters @TC-007 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName('@nit#123$');
    await signupPage.fillEmail(freshEmail());
    await signupPage.expectNameError();
    await signupPage.expectSubmitDisabled();
  });

  test('should enforce the 2-100 character name length policy @TC-006 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillEmail(freshEmail());

    await signupPage.fillFullName('a'); // below minimum
    await signupPage.expectNameError();
    await signupPage.expectSubmitDisabled();

    await signupPage.fillFullName('ab'); // minimum boundary
    await signupPage.expectSubmitEnabled();

    await signupPage.fillFullName('a'.repeat(100)); // maximum boundary
    await signupPage.expectSubmitEnabled();

    await signupPage.fillFullName('a'.repeat(101)); // above maximum
    await signupPage.expectNameError();
    await signupPage.expectSubmitDisabled();
  });

  test('should reject an already-registered email @TC-005 @regression @as-public', async ({
    page,
  }) => {
    test.skip(!env.USER_EMAIL, 'USER_EMAIL not configured in .env');

    const signupPage = await goToSignupPage(page);
    await signupPage.signUp(FULL_NAME, env.USER_EMAIL);
    await signupPage.expectDuplicateEmailError();
  });

  test('should navigate to login via the Sign in link @TC-017 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.clickSignInLink();

    const loginPage = new LoginPage(page);
    await loginPage.waitForLoaded();
    await loginPage.expectUrl(/\/login$/);
  });

  test('should show the terms auto-accept notice @TC-010 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.expectTermsNotice();
  });

  test('should submit the form with the Enter key @TC-013 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName(FULL_NAME);
    await signupPage.fillEmail(freshEmail());
    await signupPage.submitWithEnter();
    await signupPage.expectCheckEmailScreen();
  });

  test('should send the correct signup API payload @TC-018 @regression @as-public', async ({
    page,
  }) => {
    const email = freshEmail();
    const signupPage = await goToSignupPage(page);

    const requestPromise = page.waitForRequest(SIGNUP_API);
    await signupPage.signUp(FULL_NAME, email);
    const request = await requestPromise;

    expect(request.method()).toBe('POST');
    const payload = request.postDataJSON() as {
      email: string;
      name: string;
      metadata: { username: string };
      callbackURL: string;
    };
    expect(payload.email).toBe(email);
    expect(payload.name).toBe(FULL_NAME);
    expect(payload.metadata.username).toBeTruthy();
    expect(payload.callbackURL).toContain('/set-password');

    await signupPage.expectCheckEmailScreen();
  });

  test('should show a friendly error when the server returns 500 @TC-016 @regression @as-public', async ({
    page,
  }) => {
    const email = freshEmail();
    const signupPage = await goToSignupPage(page);

    await page.route(SIGNUP_API, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    await signupPage.signUp(FULL_NAME, email);

    await signupPage.expectServerError();
    await signupPage.expectFormValues(FULL_NAME, email); // no data loss
    await signupPage.expectSubmitEnabled(); // re-enabled for retry
  });

  test('should recover from a submit attempted while offline @TC-015 @regression @as-public', async ({
    page,
    context,
  }) => {
    const email = freshEmail();
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName(FULL_NAME);
    await signupPage.fillEmail(email);

    await context.setOffline(true);
    await signupPage.submit();
    await signupPage.expectServerError();
    await signupPage.expectFormValues(FULL_NAME, email); // no data loss

    // Back online, the same form must submit successfully.
    await context.setOffline(false);
    await signupPage.expectSubmitEnabled();
    await signupPage.submit();
    await signupPage.expectCheckEmailScreen();
  });

  test('should prevent double submission while the request is in flight @TC-014 @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);

    // Hold the API response until the in-flight state has been asserted.
    let releaseResponse!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route(SIGNUP_API, async (route) => {
      await hold;
      await route.continue();
    });

    await signupPage.signUp(FULL_NAME, freshEmail());
    await signupPage.expectSubmittingState(); // in flight — double submit impossible

    releaseResponse();
    await signupPage.expectCheckEmailScreen();
  });

  // ── Check-your-email screen ──────────────────────────────────────────────

  test('should show the sent-to message and resend countdown @TC-021 @TC-024 @regression @as-public', async ({
    page,
  }) => {
    const { signupPage, email } = await signUpToCheckEmail(page);
    await signupPage.expectSentTo(email);
    // Resend is not clickable while the cooldown text counts down.
    await signupPage.expectResendCountdown();
  });

  test('should send only one resend request on rapid clicks @TC-026 @regression @as-public', async ({
    page,
  }) => {
    test.slow(); // waits out the 60s resend cooldown

    const { signupPage } = await signUpToCheckEmail(page);
    await signupPage.waitForResendEnabled();

    // Hold the resend response so every rapid click lands while one request
    // is still in flight — only the first may reach the network.
    let requests = 0;
    let releaseResponse!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route(SIGNUP_API, async (route) => {
      requests += 1;
      await hold;
      await route.continue();
    });

    await signupPage.rapidClickResend(3);
    releaseResponse();

    await signupPage.expectResendCountdown(); // cooldown restarted
    expect(requests).toBe(1);
  });

  test('should survive a resend attempted while offline @TC-029 @regression @as-public', async ({
    page,
    context,
  }) => {
    test.slow(); // waits out the 60s resend cooldown

    const { signupPage } = await signUpToCheckEmail(page);
    await signupPage.waitForResendEnabled();

    await context.setOffline(true);
    await signupPage.clickResend();
    // State must not be corrupted: still on the check-email screen.
    await signupPage.expectCheckEmailScreen();

    // Back online, resend must still work (button may reappear after cooldown).
    await context.setOffline(false);
    await signupPage.waitForResendEnabled();
    await signupPage.clickResend();
    await signupPage.expectResendCountdown();
  });

  // ── Set-password screen (each test consumes a real magic link) ───────────
  // The backend rate-limits the verify endpoint, so these run sequentially in
  // one worker (mode: 'default' opts out of fullyParallel) to spread the hits.
  test.describe('via magic link', () => {
    test.describe.configure({ mode: 'default' });

    // Validation runs on submit here (unlike signup): the button stays enabled
    // and errors appear after clicking — all combos share one magic link since
    // failed submits never consume the token.
    test('should validate password rules on the set-password screen @TC-032 @TC-034 @TC-035 @TC-037 @TC-039 @regression @as-public', async ({
      page,
    }) => {
      test.slow(); // includes a real signup + email fetch

      const { setPasswordPage } = await completeSignupToSetPassword(page);

      // TC-039: empty submit — errors shown, nothing saved
      await setPasswordPage.submit();
      await setPasswordPage.expectPolicyError();
      await setPasswordPage.expectConfirmRequiredError();

      // TC-032/034/037: every policy violation gets the canonical policy error
      for (const invalidPassword of INVALID_PASSWORDS) {
        await setPasswordPage.fillPasswords(invalidPassword, invalidPassword);
        await setPasswordPage.submit();
        await setPasswordPage.expectPolicyError();
      }

      // TC-035: valid but mismatched
      await setPasswordPage.fillPasswords('Passw0rd!', 'Passw0rd@');
      await setPasswordPage.submit();
      await setPasswordPage.expectMismatchError();

      // Nothing above may have completed the flow.
      await setPasswordPage.expectUrl(/\/set-password/);
    });

    test('should prevent double submission while setting the password @TC-040 @regression @as-public', async ({
      page,
    }) => {
      test.slow(); // includes a real signup + email fetch

      const { setPasswordPage } = await completeSignupToSetPassword(page);

      let releaseResponse!: () => void;
      const hold = new Promise<void>((resolve) => {
        releaseResponse = resolve;
      });
      await page.route(SET_PASSWORD_API, async (route) => {
        await hold;
        await route.continue();
      });

      await setPasswordPage.setPassword(`Aa1!${testRunId()}`);
      await setPasswordPage.expectSubmittingState(); // in flight — no double submit

      releaseResponse();
      const loginPage = new LoginPage(page);
      await loginPage.waitForLoaded();
      await loginPage.expectUrl(/\/login/);
    });

    test('should show an error and allow retry when set-password fails @TC-041 @regression @as-public', async ({
      page,
    }) => {
      test.slow(); // includes a real signup + email fetch

      const { setPasswordPage } = await completeSignupToSetPassword(page);
      const password = `Aa1!${testRunId()}`;

      await page.route(SET_PASSWORD_API, (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
      );
      await setPasswordPage.setPassword(password);
      await setPasswordPage.expectServerError();
      await setPasswordPage.expectPasswordValues(password, password); // no data loss

      // Retry without restarting the flow: unmock and submit again.
      await page.unroute(SET_PASSWORD_API);
      await setPasswordPage.submit();
      const loginPage = new LoginPage(page);
      await loginPage.waitForLoaded();
      await loginPage.expectUrl(/\/login/);
    });

    test('should complete signup via emailed magic link and sign in @TC-023 @TC-028 @TC-031 @TC-033 @regression @as-public', async ({
      page,
    }) => {
      // Email delivery is the one legitimately slow step (5–30s typical);
      // slow() triples the default budget to 180s.
      test.slow();

      const email = freshEmail();
      // Exactly 8 characters — the policy minimum boundary (TC-033).
      const password = `Aa1!${testRunId().slice(0, 4)}`;

      const signupPage = await goToSignupPage(page);
      await signupPage.signUp(FULL_NAME, email);
      await signupPage.expectCheckEmailScreen();

      const link = await getVerificationLink(email);

      const setPasswordPage = new SetPasswordPage(page);
      await setPasswordPage.openMagicLink(link);
      await setPasswordPage.setPassword(password);

      // The app does not auto-login; it redirects to /login after setting the
      // password. Signing in with the new credentials proves the password stuck.
      const loginPage = new LoginPage(page);
      await loginPage.waitForLoaded();
      await loginPage.expectUrl(/\/login/);

      // TC-028: the consumed magic link now lands on a graceful recovery screen.
      await page.goto(link);
      await setPasswordPage.expectExpiredLinkScreen();

      await loginPage.goto();
      await loginPage.signIn(email, password);
      await loginPage.expectSignedIn();
    });
  });
});
