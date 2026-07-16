import { expect, type Locator } from '@playwright/test';
import { retry } from '../utils/retry';
import { BasePage } from './base.page';

const NAME_POLICY_ERROR = 'Name must contain only letters and spaces (2-100 characters).';
const DUPLICATE_EMAIL_ERROR = 'An account with this email already exists. Please sign in instead.';

export class SignupPage extends BasePage {
  protected readonly path = '/signup';

  protected readonly readyLocator = (): Locator => this.fullNameInput;

  private readonly fullNameInput = this.page.getByRole('textbox', { name: 'Full Name' });
  private readonly emailInput = this.page.getByRole('textbox', { name: 'Email address' });
  private readonly signUpButton = this.page.getByRole('button', { name: 'Sign up', exact: true });
  /** While the signup request is in flight the button relabels and disables. */
  private readonly signingUpButton = this.page.getByRole('button', { name: 'Signing up...' });
  /** Shown on the check-your-email screen after a successful submit. */
  private readonly openEmailLink = this.page.getByRole('link', { name: 'Open Email' });
  /** During the 60s cooldown the resend control is plain text, not a button. */
  private readonly resendCountdown = this.page.getByText(/Resend after \d+ seconds/);
  /** Appears in place of the countdown text once the cooldown expires. */
  private readonly resendButton = this.page.getByRole('button', { name: 'Resend', exact: true });
  private readonly signInLink = this.page.getByRole('link', { name: 'Sign in', exact: true });
  /** Inline validation error rendered inside the Full Name field group. */
  private readonly nameError = this.page.getByRole('alert').filter({ hasText: /name/i });
  private readonly duplicateEmailError = this.page.getByText(DUPLICATE_EMAIL_ERROR);
  private readonly termsNotice = this.page.getByText('By continuing, you agree');
  private readonly termsLink = this.page.getByRole('link', { name: 'Terms and Privacy' });
  /** Generic failure message — shown for 5xx ("…Please try again.") and network errors. */
  private readonly serverError = this.page.getByText(/Something went wrong/);

  // ── Actions ─────────────────────────────────────────────────────────────
  /** Fills and blurs — the form runs field validation on blur. */
  async fillFullName(value: string): Promise<void> {
    await this.fullNameInput.fill(value);
    await this.fullNameInput.blur();
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
    await this.emailInput.blur();
  }

  async submit(): Promise<void> {
    await this.signUpButton.click();
  }

  async signUp(fullName: string, email: string): Promise<void> {
    await this.fillFullName(fullName);
    await this.fillEmail(email);
    await this.submit();
  }

  async submitWithEnter(): Promise<void> {
    await this.emailInput.press('Enter');
  }

  async clickSignInLink(): Promise<void> {
    await this.signInLink.click();
  }

  /** The resend button only materializes after the 60s cooldown runs out. */
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
    await expect(this.fullNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  async expectCheckEmailScreen(): Promise<void> {
    await expect(this.openEmailLink).toBeVisible();
  }

  async expectSentTo(email: string): Promise<void> {
    await expect(this.page.getByText(`We've sent a verification link to ${email}`)).toBeVisible();
  }

  /** While the cooldown is running, resend must not be clickable. */
  async expectResendCountdown(): Promise<void> {
    await expect(this.resendCountdown).toBeVisible();
    await expect(this.resendButton).toBeHidden();
  }

  /** The form gates invalid input by disabling the submit button. */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.signUpButton).toBeDisabled();
  }

  async expectSubmitEnabled(): Promise<void> {
    await expect(this.signUpButton).toBeEnabled();
  }

  async expectNameError(): Promise<void> {
    await expect(this.nameError).toHaveText(NAME_POLICY_ERROR);
  }

  async expectDuplicateEmailError(): Promise<void> {
    await expect(this.duplicateEmailError).toBeVisible();
  }

  /** Terms are auto-accepted on continue — there is no checkbox by design. */
  async expectTermsNotice(): Promise<void> {
    await expect(this.termsNotice).toBeVisible();
    await expect(this.termsLink).toBeVisible();
  }

  async expectServerError(): Promise<void> {
    await expect(this.serverError).toBeVisible();
  }

  /** Loading state: "Signing up..." label shown, button disabled — no double submit. */
  async expectSubmittingState(): Promise<void> {
    await expect(this.signingUpButton).toBeVisible();
    await expect(this.signingUpButton).toBeDisabled();
  }

  /** No data loss after a failed submit. */
  async expectFormValues(fullName: string, email: string): Promise<void> {
    await expect(this.fullNameInput).toHaveValue(fullName);
    await expect(this.emailInput).toHaveValue(email);
  }
}

const PASSWORD_POLICY_ERROR =
  'Password must be 8-64 characters with uppercase, lowercase, number and special character.';

export class SetPasswordPage extends BasePage {
  protected readonly path = '/set-password';

  protected readonly readyLocator = (): Locator => this.newPasswordInput;

  private readonly newPasswordInput = this.page.getByRole('textbox', { name: 'New password' });
  private readonly confirmPasswordInput = this.page.getByRole('textbox', {
    name: 'Confirm password',
  });
  private readonly setPasswordButton = this.page.getByRole('button', { name: 'Set password' });
  /** While the request is in flight the button relabels to "Saving..." and disables. */
  private readonly savingButton = this.page.getByRole('button', { name: 'Saving...' });

  /** Validation runs on submit — the button stays enabled even for invalid input. */
  private readonly policyError = this.page
    .getByRole('alert')
    .filter({ hasText: 'Password must be' });
  private readonly confirmRequiredError = this.page
    .getByRole('alert')
    .filter({ hasText: 'Please confirm your password.' });
  private readonly mismatchError = this.page
    .getByRole('alert')
    .filter({ hasText: 'Passwords do not match.' });
  private readonly serverError = this.page.getByText('Could not set your password.');

  /** Shown when a used or expired magic link is opened (?error=INVALID_TOKEN). */
  private readonly expiredHeading = this.page.getByRole('heading', {
    name: 'Verification Link Expired',
  });
  private readonly resendLinkButton = this.page.getByRole('button', { name: 'Resend Link' });

  // ── Actions ─────────────────────────────────────────────────────────────
  /**
   * The emailed magic link verifies its token server-side, then redirects here.
   * The verify endpoint rate-limits bursts (429 "Too many requests"), which
   * parallel signup tests can trigger — so back off and retry.
   */
  async openMagicLink(link: string): Promise<void> {
    this.log.info('opening magic link');
    await retry(
      async () => {
        await this.page.goto(link);
        if (await this.page.getByText('Too many requests').isVisible()) {
          throw new Error('rate-limited while opening the magic link');
        }
        await this.waitForLoaded();
      },
      { attempts: 4, baseDelayMs: 15_000, factor: 1, label: 'open-magic-link' },
    );
  }

  async fillPasswords(password: string, confirm: string): Promise<void> {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(confirm);
    await this.confirmPasswordInput.blur();
  }

  async submit(): Promise<void> {
    await this.setPasswordButton.click();
  }

  async setPassword(password: string): Promise<void> {
    await this.fillPasswords(password, password);
    await this.submit();
  }

  // ── Assertions ──────────────────────────────────────────────────────────
  async expectPolicyError(): Promise<void> {
    await expect(this.policyError).toHaveText(PASSWORD_POLICY_ERROR);
  }

  async expectConfirmRequiredError(): Promise<void> {
    await expect(this.confirmRequiredError).toBeVisible();
  }

  async expectMismatchError(): Promise<void> {
    await expect(this.mismatchError).toBeVisible();
  }

  async expectServerError(): Promise<void> {
    await expect(this.serverError).toBeVisible();
  }

  /** Loading state — "Saving..." label shown, button disabled while in flight. */
  async expectSubmittingState(): Promise<void> {
    await expect(this.savingButton).toBeVisible();
    await expect(this.savingButton).toBeDisabled();
  }

  /** No data loss after a failed submit. */
  async expectPasswordValues(password: string, confirm: string): Promise<void> {
    await expect(this.newPasswordInput).toHaveValue(password);
    await expect(this.confirmPasswordInput).toHaveValue(confirm);
  }

  /** A consumed or expired magic link lands on a graceful recovery screen. */
  async expectExpiredLinkScreen(): Promise<void> {
    await expect(this.expiredHeading).toBeVisible();
    await expect(this.resendLinkButton).toBeVisible();
  }
}
