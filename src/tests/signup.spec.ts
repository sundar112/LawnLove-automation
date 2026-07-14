import { expect, test, type Page } from '@playwright/test';
import { env } from '../config/env';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { SetPasswordPage, SignupPage } from '../pages/signup.page';
import { freshEmail, getVerificationLink } from '../utils/email';
import { testRunId } from '../utils/unique';

const FULL_NAME = 'Automation Test';

const INVALID_EMAILS = ['anit@', 'anitsharma@gmailcom', 'plainaddress'];

/** The signup endpoint (better-auth magic link) — captured from the live app. */
const SIGNUP_API = '**/api/auth/sign-in/magic-link';

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

  test('should complete signup via emailed magic link and sign in @regression @as-public', async ({
    page,
  }) => {
    // Email delivery is the one legitimately slow step (5–30s typical);
    // slow() triples the default budget to 180s.
    test.slow();

    const email = freshEmail();
    const password = `Aa1!${testRunId()}`;

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
    await loginPage.signIn(email, password);
    await loginPage.expectSignedIn();
  });
});
