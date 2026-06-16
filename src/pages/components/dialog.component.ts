import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Modal dialog component. Centralises confirm/cancel/close.
 *
 * Default rootLocator targets the ARIA `dialog` role, which Radix, MUI,
 * Headless UI, Reach UI, etc. all expose by default.
 */
export class DialogComponent {
  constructor(private readonly page: Page) {}

  rootLocator(): Locator {
    return this.page.getByRole('dialog');
  }

  async expectOpen(title?: string | RegExp): Promise<void> {
    const dialog = this.rootLocator();
    await expect(dialog).toBeVisible();
    if (title !== undefined) {
      await expect(dialog).toContainText(title);
    }
  }

  async expectClosed(): Promise<void> {
    await expect(this.rootLocator()).toHaveCount(0);
  }

  async confirm(buttonName: string | RegExp = /confirm|ok|save|yes|delete/i): Promise<void> {
    const dialog = this.rootLocator();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: buttonName }).click();
    await this.expectClosed();
  }

  async cancel(buttonName: string | RegExp = /cancel|close|no/i): Promise<void> {
    const dialog = this.rootLocator();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: buttonName }).click();
    await this.expectClosed();
  }
}
