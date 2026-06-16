import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * ExamplePage — template starter page object.
 *
 * Replace this with your actual page (e.g. DashboardPage, LoginPage).
 * Naming convention: <FeatureName>Page in src/pages/<feature>.page.ts
 *
 * Steps to adapt:
 *   1. Rename the class and file to match your feature
 *   2. Set `path` to the URL path of the page
 *   3. Set `readyLocator` to a unique element that confirms the page loaded
 *   4. Add methods for each user action on the page
 */
export class ExamplePage extends BasePage {
  protected readonly path = '/example';

  protected readonly readyLocator = (): Locator =>
    this.page.getByRole('heading', { name: /example/i });

  // ── Actions ───────────────────────────────────────────────────────────

  async fillName(value: string): Promise<void> {
    await this.fillByLabel('Name', value);
  }

  async submit(): Promise<void> {
    await this.clickByRole('button', /submit/i);
  }

  async expectSuccessBanner(): Promise<void> {
    await this.expectToast(/success/i);
  }
}
