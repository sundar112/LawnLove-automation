import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Sidebar / left navigation component.
 *
 * Default selector targets the primary `<nav>`. Adjust if your app uses a
 * different convention (e.g. a `data-testid="side-menu"` container).
 */
export class SideMenuComponent {
  constructor(private readonly page: Page) {}

  rootLocator(): Locator {
    return this.page
      .getByTestId('side-menu')
      .or(this.page.getByRole('navigation', { name: /main|primary/i }));
  }

  async navigateTo(itemName: string | RegExp): Promise<void> {
    const link = this.rootLocator().getByRole('link', { name: itemName });
    await expect(link).toBeVisible();
    await link.click();
  }

  async expectActive(itemName: string | RegExp): Promise<void> {
    const link = this.rootLocator().getByRole('link', { name: itemName });
    await expect(link).toHaveAttribute('aria-current', /page|true/);
  }
}
