import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SignupPage extends BasePage {
  protected readonly path = '/signup';

  protected readonly readyLocator = (): Locator => this.fullNameInput;

  private readonly fullNameInput = this.page.getByRole('textbox', { name: 'Full Name' });
  private readonly emailInput = this.page.getByRole('textbox', { name: 'Email address' });
  private readonly signUpButton = this.page.getByRole('button', { name: 'Sign up', exact: true });
  /** Shown on the check-your-email screen after a successful submit. */
  private readonly openEmailLink = this.page.getByRole('link', { name: 'Open Email' });

  async signUp(fullName: string, email: string): Promise<void> {
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.signUpButton.click();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.fullNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  async expectCheckEmailScreen(): Promise<void> {
    await expect(this.openEmailLink).toBeVisible();
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
