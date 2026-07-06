import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  protected readonly path = '/';

  protected readonly readyLocator = (): Locator => this.page.locator('body');
}
