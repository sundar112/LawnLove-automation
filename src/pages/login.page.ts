import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = '/login';

  protected readonly readyLocator = (): Locator => this.heading;

  private readonly heading = this.page.getByRole('heading', { name: 'Sign in to your account' });
  private readonly emailInput = this.page.getByRole('textbox', { name: 'Email address' });
  private readonly passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  private readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  /** While the login request is in flight the button relabels and disables. */
  private readonly signingInButton = this.page.getByRole('button', { name: 'Signing in...' });
  // exact: true — the navbar "Log in / Sign up" link also substring-matches "Sign up".
  private readonly signUpLink = this.page.getByRole('link', { name: 'Sign up', exact: true });
  private readonly rememberMeCheckbox = this.page.getByRole('checkbox', { name: 'Remember me' });
  private readonly showPasswordButton = this.page.getByRole('button', { name: 'Show password' });
  private readonly hidePasswordButton = this.page.getByRole('button', { name: 'Hide password' });

  /** Same generic message for wrong password and unknown account — no existence leak. */
  private readonly invalidCredentialsError = this.page.getByText('Invalid email or password');
  /** Shown for 5xx/network failures — distinct from the credentials error. */
  private readonly serverError = this.page.getByText(/Something went wrong/);
  /** Field-level alerts shown when submitting an incomplete form. */
  private readonly emailFieldError = this.page
    .getByRole('alert')
    .filter({ hasText: 'Please enter a valid email address.' });
  private readonly passwordFieldError = this.page
    .getByRole('alert')
    .filter({ hasText: 'Password is required.' });

  /** Present for every authenticated user — the dashboard heading varies by
   * account state ("Dashboard" for new accounts, "Welcome Back!" for others). */
  private readonly logOutButton = this.page.getByRole('button', { name: 'Log out' });

  // ── Actions ─────────────────────────────────────────────────────────────
  async clickSignUpLink(): Promise<void> {
    await this.signUpLink.click();
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.signInButton.click();
  }

  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  async signIn(email: string, password: string, rememberMe = false): Promise<void> {
    await this.fillCredentials(email, password);
    if (rememberMe) await this.rememberMeCheckbox.check();
    await this.submit();
  }

  async clickShowPassword(): Promise<void> {
    await this.showPasswordButton.click();
  }

  async clickHidePassword(): Promise<void> {
    await this.hidePasswordButton.click();
  }

  // ── Assertions ──────────────────────────────────────────────────────────
  /** A successful sign-in always lands on the dashboard. */
  async expectSignedIn(): Promise<void> {
    await this.expectUrl(/\/dashboard$/);
    await expect(this.logOutButton).toBeVisible();
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.invalidCredentialsError).toBeVisible();
  }

  async expectServerError(): Promise<void> {
    await expect(this.serverError).toBeVisible();
  }

  /** Validation runs on submit — empty submit flags both fields. */
  async expectEmptyFieldErrors(): Promise<void> {
    await expect(this.emailFieldError).toBeVisible();
    await expect(this.passwordFieldError).toBeVisible();
  }

  /** Loading state: "Signing in..." label shown, button disabled — no double submit. */
  async expectSubmittingState(): Promise<void> {
    await expect(this.signingInButton).toBeVisible();
    await expect(this.signingInButton).toBeDisabled();
  }

  /** The button keeps its label and stays enabled — validation happens on submit. */
  async expectSignInButtonReady(): Promise<void> {
    await expect(this.signInButton).toBeVisible();
    await expect(this.signInButton).toBeEnabled();
  }

  /** No data loss after a failed submit. */
  async expectFormValues(email: string, password: string): Promise<void> {
    await expect(this.emailInput).toHaveValue(email);
    await expect(this.passwordInput).toHaveValue(password);
  }

  async expectPasswordMasked(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async expectPasswordRevealed(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
  }
}
