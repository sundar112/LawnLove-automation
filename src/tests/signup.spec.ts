import { test, type Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { SetPasswordPage, SignupPage } from '../pages/signup.page';
import { freshEmail, getVerificationLink } from '../utils/email';
import { testRunId } from '../utils/unique';

const FULL_NAME = 'Automation Test';

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
