import type { Locator, Page } from '@playwright/test';

/**
 * Locator helpers in priority order:
 *   1. byTestId  — preferred when data-testid attributes are available
 *   2. byRole    — accessible role + name
 *   3. byLabel   — form label association
 *   4. byText    — last resort, only for static visible copy
 *
 * BANNED: XPath that depends on CSS class names, index-based selectors for
 * non-deterministic lists, hardcoded dynamic values inside locators.
 */

export const byTestId = (scope: Page | Locator, testId: string): Locator =>
  scope.getByTestId(testId);

export const byRole = (
  scope: Page | Locator,
  role: Parameters<Page['getByRole']>[0],
  name?: string | RegExp,
): Locator => (name === undefined ? scope.getByRole(role) : scope.getByRole(role, { name }));

export const byLabel = (scope: Page | Locator, label: string | RegExp, exact = false): Locator =>
  scope.getByLabel(label, { exact });

export const byText = (scope: Page | Locator, text: string | RegExp, exact = false): Locator =>
  scope.getByText(text, { exact });

export const byPlaceholder = (scope: Page | Locator, placeholder: string | RegExp): Locator =>
  scope.getByPlaceholder(placeholder);
