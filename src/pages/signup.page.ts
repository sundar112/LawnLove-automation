import { expect, type Locator } from '@playwright/test';
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

  // ── Assertions ──────────────────────────────────────────────────────────
  async expectFormVisible(): Promise<void> {
    await expect(this.fullNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  async expectCheckEmailScreen(): Promise<void> {
    await expect(this.openEmailLink).toBeVisible();
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

export class SetPasswordPage extends BasePage {
  protected readonly path = '/set-password';

  protected readonly readyLocator = (): Locator => this.newPasswordInput;

  private readonly newPasswordInput = this.page.getByRole('textbox', { name: 'New password' });
  private readonly confirmPasswordInput = this.page.getByRole('textbox', {
    name: 'Confirm password',
  });
  private readonly setPasswordButton = this.page.getByRole('button', { name: 'Set password' });

  /** The emailed magic link verifies its token server-side, then redirects here. */
  async openMagicLink(link: string): Promise<void> {
    this.log.info('opening magic link');
    await this.page.goto(link);
    await this.waitForLoaded();
  }

  async setPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.setPasswordButton.click();
  }
}
