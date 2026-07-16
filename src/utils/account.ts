import { type Page } from '@playwright/test';
import { SetPasswordPage, SignupPage } from '../pages/signup.page';
import { getVerificationLink } from './email';
import { freshEmail } from './email';
import { testRunId } from './unique';

export interface ThrowawayAccount {
  email: string;
  password: string;
}

/**
 * Creates a fresh, fully verified account through the real signup flow
 * (signup → magic link from the inbox → set password), then clears cookies —
 * setting the password auto-signs the user in, and authenticated users get
 * redirected away from public auth pages. Ends logged out.
 * ~15-30s including email delivery — call test.slow() in tests using this.
 */
export const createVerifiedAccount = async (
  page: Page,
  fullName = 'Automation Test',
): Promise<ThrowawayAccount> => {
  const email = freshEmail();
  const password = `Aa1!${testRunId()}`;

  const signupPage = new SignupPage(page);
  await signupPage.goto();
  await signupPage.signUp(fullName, email);
  await signupPage.expectCheckEmailScreen();

  const link = await getVerificationLink(email);
  const setPasswordPage = new SetPasswordPage(page);
  await setPasswordPage.openMagicLink(link);
  await setPasswordPage.setPassword(password);

  await page.waitForURL(/login/);
  await page.context().clearCookies();

  return { email, password };
};
