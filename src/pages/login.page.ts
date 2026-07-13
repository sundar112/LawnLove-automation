import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = '/login';

  protected readonly readyLocator = (): Locator => this.heading;

  private readonly heading = this.page.getByRole('heading', { name: 'Sign in to your account' });
  private readonly emailInput = this.page.getByRole('textbox', { name: 'Email address' });
  private readonly passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  private readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  // exact: true — the navbar "Log in / Sign up" link also substring-matches "Sign up".
  private readonly signUpLink = this.page.getByRole('link', { name: 'Sign up', exact: true });

  private readonly dashboardHeading = this.page.getByRole('heading', { name: 'Dashboard' });

  async clickSignUpLink(): Promise<void> {
    await this.signUpLink.click();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  /** A successful sign-in always lands on the dashboard. */
  async expectSignedIn(): Promise<void> {
    await this.expectUrl(/\/dashboard$/);
    await expect(this.dashboardHeading).toBeVisible();
  }
}
