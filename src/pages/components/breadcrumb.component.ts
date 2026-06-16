import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Breadcrumb component. Centralises the "where am I in the nav hierarchy?"
 * assertion.
 *
 * Default selector targets ARIA navigation labelled "breadcrumb".
 */
export class BreadcrumbComponent {
  constructor(private readonly page: Page) {}

  rootLocator(): Locator {
    return this.page.getByRole('navigation', { name: /breadcrumb/i });
  }

  items(): Locator {
    return this.rootLocator().getByRole('listitem');
  }

  async expectTrail(crumbs: string[]): Promise<void> {
    await expect(this.items()).toHaveText(crumbs);
  }

  async clickCrumb(name: string | RegExp): Promise<void> {
    const link = this.rootLocator().getByRole('link', { name });
    await expect(link).toBeVisible();
    await link.click();
  }
}
