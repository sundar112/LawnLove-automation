import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Toast/snackbar component. Centralises every toast assertion.
 *
 * Default selector strategy: a container with role="status" or role="alert".
 * Override `rootLocator` if your UI library uses a different convention.
 */
export class ToastComponent {
  constructor(private readonly page: Page) {}

  rootLocator(): Locator {
    return this.page
      .getByRole('alert')
      .or(this.page.getByRole('status'))
      .or(this.page.getByTestId('toast'));
  }

  async expectVisible(text: string | RegExp): Promise<void> {
    const toast = this.rootLocator().filter({ hasText: text });
    await expect(toast).toBeVisible();
  }

  async expectNone(): Promise<void> {
    await expect(this.rootLocator()).toHaveCount(0);
  }

  async dismiss(): Promise<void> {
    const closeBtn = this.rootLocator()
      .first()
      .getByRole('button', { name: /close|dismiss/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
    await this.expectNone();
  }
}
