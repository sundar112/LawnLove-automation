import { test, type Page } from '@playwright/test';
import { env } from '../config/env';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { SetPasswordPage, SignupPage } from '../pages/signup.page';
import { freshEmail, getVerificationLink } from '../utils/email';
import { testRunId } from '../utils/unique';

const FULL_NAME = 'Automation Test';

const INVALID_EMAILS = ['anit@', 'anitsharma@gmailcom', 'plainaddress'];

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

  test('should show the check-your-email screen after submitting @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.signUp(FULL_NAME, freshEmail());
    await signupPage.expectCheckEmailScreen();
  });

  // The form gates invalid input by disabling Sign up — there is no
  // "submit and see errors" path for empty/invalid fields.
  test('should keep Sign up disabled until the form is complete @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.expectSubmitDisabled();

    await signupPage.fillFullName(FULL_NAME);
    await signupPage.expectSubmitDisabled();

    await signupPage.fillEmail(freshEmail());
    await signupPage.expectSubmitEnabled();
  });

  test('should keep Sign up disabled for invalid email formats @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName(FULL_NAME);

    for (const invalidEmail of INVALID_EMAILS) {
      await signupPage.fillEmail(invalidEmail);
      await signupPage.expectSubmitDisabled();
    }
  });

  test('should show a name error for a whitespace-only name @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName('   ');
    await signupPage.fillEmail(freshEmail());
    await signupPage.expectNameError();
    await signupPage.expectSubmitDisabled();
  });

  test('should show a name error for special characters @regression @as-public', async ({
    page,
  }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName('@nit#123$');
    await signupPage.fillEmail(freshEmail());
    await signupPage.expectNameError();
    await signupPage.expectSubmitDisabled();
  });

  test('should reject an already-registered email @regression @as-public', async ({ page }) => {
    test.skip(!env.USER_EMAIL, 'USER_EMAIL not configured in .env');

    const signupPage = await goToSignupPage(page);
    await signupPage.signUp(FULL_NAME, env.USER_EMAIL);
    await signupPage.expectDuplicateEmailError();
  });

  test('should navigate to login via the Sign in link @regression @as-public', async ({ page }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.clickSignInLink();

    const loginPage = new LoginPage(page);
    await loginPage.waitForLoaded();
    await loginPage.expectUrl(/\/login$/);
  });

  test('should show the terms auto-accept notice @regression @as-public', async ({ page }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.expectTermsNotice();
  });

  test('should submit the form with the Enter key @regression @as-public', async ({ page }) => {
    const signupPage = await goToSignupPage(page);
    await signupPage.fillFullName(FULL_NAME);
    await signupPage.fillEmail(freshEmail());
    await signupPage.submitWithEnter();
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
