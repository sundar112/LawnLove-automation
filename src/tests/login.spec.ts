import { expect, test, type Browser, type Page } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/login.page';
import { SignupPage } from '../pages/signup.page';
import { freshEmail } from '../utils/email';
import { testRunId } from '../utils/unique';

/** Login endpoint (better-auth) — captured from the live app. */
const LOGIN_API = '**/api/auth/sign-in/email';

/** better-auth session cookie; expires=-1 means session-only. */
const SESSION_COOKIE = '__Secure-better-auth.session_token';

const FULL_NAME = 'Automation Test';

async function goToLoginPage(page: Page): Promise<LoginPage> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  return loginPage;
}

/** Sign in inside a dedicated context and return the session cookie. */
async function sessionCookieFor(browser: Browser, rememberMe: boolean) {
  const context = await browser.newContext();
  const loginPage = new LoginPage(await context.newPage());
  await loginPage.goto();
  await loginPage.signIn(env.USER_EMAIL, env.USER_PASSWORD, rememberMe);
  await loginPage.expectSignedIn();
  const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
  await context.close();
  return cookie;
}

// @chromium-only: real credentials + the backend rate-limits auth bursts.
// mode 'default' keeps the login POSTs sequential for the same reason.
test.describe('Login @chromium-only', () => {
  test.describe.configure({ mode: 'default' });

  test.skip(!env.USER_EMAIL || !env.USER_PASSWORD, 'USER_EMAIL/USER_PASSWORD not configured');

  test('should sign in with valid credentials @TC-042 @smoke @as-public', async ({ page }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.signIn(env.USER_EMAIL, env.USER_PASSWORD);
    await loginPage.expectSignedIn();
  });

  test('should show a generic error for a wrong password @TC-043 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.signIn(env.USER_EMAIL, `Wrong1!${testRunId()}`);
    await loginPage.expectInvalidCredentialsError();
  });

  // Same message as TC-043 on purpose: a distinct "account not found" reply
  // would leak which emails are registered.
  test('should show the same generic error for an unknown account @TC-044 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.signIn(freshEmail(), `Wrong1!${testRunId()}`);
    await loginPage.expectInvalidCredentialsError();
  });

  test('should flag both fields when submitting empty @TC-045 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.submit();
    await loginPage.expectEmptyFieldErrors();
    await loginPage.expectUrl(/\/login/);
  });

  // An account that signed up but never opened its verification link has no
  // password — any login attempt must fail without leaking why.
  test('should not sign in an unverified account @TC-047 @regression @as-public', async ({
    page,
  }) => {
    test.slow(); // includes a real signup

    const unverifiedEmail = freshEmail();
    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.signUp(FULL_NAME, unverifiedEmail);
    await signupPage.expectCheckEmailScreen();

    const loginPage = await goToLoginPage(page);
    await loginPage.signIn(unverifiedEmail, `Whatever1!${testRunId()}`);
    await loginPage.expectInvalidCredentialsError();
    await loginPage.expectUrl(/\/login/);
  });

  // Remember me controls session persistence (cookie lifetime), not autofill.
  test('should persist the session only when Remember me is checked @TC-048 @TC-049 @regression @as-public', async ({
    browser,
  }) => {
    test.slow(); // two full logins in separate contexts

    const sessionOnly = await sessionCookieFor(browser, false);
    expect(sessionOnly, 'session cookie should exist').toBeTruthy();
    expect(sessionOnly?.expires, 'unchecked → session-only cookie').toBe(-1);

    const persistent = await sessionCookieFor(browser, true);
    expect(persistent, 'session cookie should exist').toBeTruthy();
    expect(persistent?.expires, 'checked → cookie outlives the browser').toBeGreaterThan(
      Date.now() / 1000,
    );
  });

  test('should keep the Sign in button labeled and enabled at every input stage @TC-050 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.expectSignInButtonReady(); // empty

    await loginPage.fillCredentials(env.USER_EMAIL, '');
    await loginPage.expectSignInButtonReady(); // partial

    await loginPage.fillCredentials(env.USER_EMAIL, 'Whatever1!');
    await loginPage.expectSignInButtonReady(); // complete
  });

  test('should navigate to signup via the Sign up link @TC-051 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.clickSignUpLink();

    const signupPage = new SignupPage(page);
    await signupPage.waitForLoaded();
    await signupPage.expectUrl(/\/signup$/);
  });

  test('should prevent double submission while signing in @TC-052 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);

    let releaseResponse!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route(LOGIN_API, async (route) => {
      await hold;
      await route.continue();
    });

    await loginPage.signIn(env.USER_EMAIL, env.USER_PASSWORD);
    await loginPage.expectSubmittingState(); // in flight — no double submit

    releaseResponse();
    await loginPage.expectSignedIn();
  });

  test('should show an error and allow retry when login fails server-side @TC-053 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);

    await page.route(LOGIN_API, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    await loginPage.signIn(env.USER_EMAIL, env.USER_PASSWORD);
    await loginPage.expectServerError();
    await loginPage.expectFormValues(env.USER_EMAIL, env.USER_PASSWORD); // no data loss

    // Retry without re-typing: unmock and submit again.
    await page.unroute(LOGIN_API);
    await loginPage.submit();
    await loginPage.expectSignedIn();
  });

  test('should submit the form with the Enter key @TC-054 @regression @as-public', async ({
    page,
  }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.fillCredentials(env.USER_EMAIL, env.USER_PASSWORD);
    await loginPage.submitWithEnter();
    await loginPage.expectSignedIn();
  });

  // Not on the sheet yet — the login form has a working visibility toggle
  // (the set-password screen lacks one, see TC-036).
  test('should toggle password visibility @regression @as-public', async ({ page }) => {
    const loginPage = await goToLoginPage(page);
    await loginPage.fillCredentials(env.USER_EMAIL, 'Whatever1!');

    await loginPage.expectPasswordMasked();
    await loginPage.clickShowPassword();
    await loginPage.expectPasswordRevealed();
    await loginPage.clickHidePassword();
    await loginPage.expectPasswordMasked();
  });
});
