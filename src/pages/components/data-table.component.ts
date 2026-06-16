import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Data-table component. Use to assert on rows, columns, and cells without
 * baking table-specific logic into individual page objects.
 *
 * Wrap your concrete table by passing a scoped locator:
 *   const table = new DataTableComponent(page, page.getByTestId('users-table'));
 */
export class DataTableComponent {
  constructor(
    _page: Page,
    private readonly rootLocator: Locator,
  ) {
    void _page;
  }

  rows(): Locator {
    return this.rootLocator.getByRole('row');
  }

  rowByText(text: string | RegExp): Locator {
    return this.rows().filter({ hasText: text });
  }

  cell(rowText: string | RegExp, columnAccessibleName: string | RegExp): Locator {
    return this.rowByText(rowText).getByRole('cell', { name: columnAccessibleName });
  }

  async expectRowCount(count: number): Promise<void> {
    // Subtract header row when present.
    await expect(this.rows()).toHaveCount(count + 1);
  }

  async expectRowVisible(rowText: string | RegExp): Promise<void> {
    await expect(this.rowByText(rowText)).toBeVisible();
  }

  async expectRowAbsent(rowText: string | RegExp): Promise<void> {
    await expect(this.rowByText(rowText)).toHaveCount(0);
  }

  async expectCellText(
    rowText: string | RegExp,
    columnAccessibleName: string | RegExp,
    expected: string | RegExp,
  ): Promise<void> {
    await expect(this.cell(rowText, columnAccessibleName)).toHaveText(expected);
  }

  async clickRow(rowText: string | RegExp): Promise<void> {
    const row = this.rowByText(rowText);
    await expect(row).toBeVisible();
    await row.click();
  }
}
