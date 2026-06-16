import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Custom-select wrapper.
 *
 * Many React UIs use Radix/Headless UI/MUI Selects which are NOT native
 * <select> elements. Strategy:
 *   1. Click the trigger to open the listbox.
 *   2. Wait for `role=listbox` to be visible.
 *   3. Click the option whose accessible name matches.
 *
 * If your UI uses native <select>, override and use locator.selectOption().
 */
export class SelectComponent {
  constructor(private readonly page: Page) {}

  async selectOption(trigger: Locator, optionText: string): Promise<void> {
    await expect(trigger).toBeEnabled();
    await trigger.click();
    const listbox = this.page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    const option = listbox.getByRole('option', { name: optionText });
    await expect(option).toBeVisible();
    await option.click();
    await expect(listbox).toBeHidden();
  }
}
