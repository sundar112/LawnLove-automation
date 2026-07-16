import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

const RESET_COPY = "We've emailed you a secure link to reset your password";

export class ForgotPasswordPage extends BasePage {
  protected readonly path = '/forgot-password';

  protected readonly readyLocator = (): Locator => this.heading;

  private readonly heading = this.page.getByRole('heading', { name: 'Forgot your password?' });
  private readonly emailInput = this.page.getByRole('textbox', { name: 'Email address' });
  private readonly sendResetLinkButton = this.page.getByRole('button', { name: 'Send reset link' });
  /** Case-insensitive: the form says "Back to sign in", the check-email screen
   * "Back to Sign in" (twice) — .first() avoids the strict-mode clash. */
  private readonly backToSignInLink = this.page
    .getByRole('link', { name: /Back to sign in/i })
    .first();
  /** Shown for 5xx/network failures. */
  private readonly serverError = this.page.getByText(/Something went wrong/);

  // ── Check-email screen (same route, swapped content after submit) ───────
  private readonly checkEmailHeading = this.page.getByRole('heading', {
    name: 'Check Your Email',
  });
  private readonly resetCopy = this.page.getByText(RESET_COPY);
  /** During the cooldown the resend control is plain text, not a button. */
  private readonly resendCountdown = this.page.getByText(/Resend after \d+ seconds/);
  private readonly resendButton = this.page.getByRole('button', { name: 'Resend', exact: true });

  // ── Actions ─────────────────────────────────────────────────────────────
  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.sendResetLinkButton.click();
  }

  async clickBackToSignIn(): Promise<void> {
    await this.backToSignInLink.click();
  }

  /** The resend button only materializes after the ~60s cooldown runs out. */
  async waitForResendEnabled(): Promise<void> {
    await expect(this.resendButton).toBeVisible({ timeout: 70_000 });
  }

  async clickResend(): Promise<void> {
    await this.resendButton.click();
  }

  /** Dispatches several rapid clicks in one gesture — double-submit guard check. */
  async rapidClickResend(times = 3): Promise<void> {
    await this.resendButton.click({ clickCount: times });
  }

  // ── Assertions ──────────────────────────────────────────────────────────
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.sendResetLinkButton).toBeVisible();
    await expect(this.backToSignInLink).toBeVisible();
  }

  /** Reset variant of the check-email screen — distinct copy from signup's. */
  async expectCheckEmailScreen(): Promise<void> {
    await expect(this.checkEmailHeading).toBeVisible();
    await expect(this.resetCopy).toBeVisible();
  }

  /** While the cooldown is running, resend must not be clickable. */
  async expectResendCountdown(): Promise<void> {
    await expect(this.resendCountdown).toBeVisible();
    await expect(this.resendButton).toBeHidden();
  }

  async expectServerError(): Promise<void> {
    await expect(this.serverError).toBeVisible();
  }
}
