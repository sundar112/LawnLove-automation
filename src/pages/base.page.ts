import { expect, type Locator, type Page } from '@playwright/test';
import { byLabel, byRole, byTestId } from '../utils/locators';
import { ToastComponent } from './components/toast.component';
import { DialogComponent } from './components/dialog.component';
import { SelectComponent } from './components/select.component';
import { BreadcrumbComponent } from './components/breadcrumb.component';
import { childLogger, type Logger } from '../utils/logger';

/**
 * BasePage — every concrete page extends this.
 *
 * It owns the Page handle and wires reusable components (toast, dialog,
 * select, breadcrumb). Concrete pages MUST NOT duplicate generic wait/click/
 * visibility boilerplate.
 */
export abstract class BasePage {
  protected readonly log: Logger;

  readonly toast: ToastComponent;
  readonly dialog: DialogComponent;
  readonly select: SelectComponent;
  readonly breadcrumb: BreadcrumbComponent;

  /** Subclasses set this so `goto()` knows the canonical path. */
  protected abstract readonly path: string;

  /** Subclasses provide a "you've landed" locator used by waitForLoaded(). */
  protected abstract readonly readyLocator: () => Locator;

  constructor(protected readonly page: Page) {
    this.log = childLogger(this.constructor.name);
    this.toast = new ToastComponent(page);
    this.dialog = new DialogComponent(page);
    this.select = new SelectComponent(page);
    this.breadcrumb = new BreadcrumbComponent(page);
  }

  // ── Navigation ────────────────────────────────────────────────────────
  async goto(extraPath = ''): Promise<void> {
    const target = `${this.path}${extraPath}`.replace(/([^:])\/+/g, '$1/');
    this.log.info({ path: target }, 'goto');
    await this.page.goto(target);
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.readyLocator()).toBeVisible();
  }

  async expectUrl(matcher: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(matcher);
  }

  async expectBreadcrumb(...crumbs: string[]): Promise<void> {
    await this.breadcrumb.expectTrail(crumbs);
  }

  // ── Inputs (locator priority) ─────────────────────────────────────────
  async fillByTestId(testId: string, value: string): Promise<void> {
    const el = byTestId(this.page, testId);
    await expect(el).toBeVisible();
    await el.fill(value);
  }

  async fillByLabel(label: string | RegExp, value: string): Promise<void> {
    const el = byLabel(this.page, label);
    await expect(el).toBeVisible();
    await el.fill(value);
  }

  async fillByRole(
    role: Parameters<Page['getByRole']>[0],
    name: string | RegExp,
    value: string,
  ): Promise<void> {
    const el = byRole(this.page, role, name);
    await expect(el).toBeVisible();
    await el.fill(value);
  }

  // ── Clicks ────────────────────────────────────────────────────────────
  async clickByTestId(testId: string): Promise<void> {
    const el = byTestId(this.page, testId);
    await expect(el).toBeEnabled();
    await el.click();
  }

  async clickByRole(role: Parameters<Page['getByRole']>[0], name: string | RegExp): Promise<void> {
    const el = byRole(this.page, role, name);
    await expect(el).toBeEnabled();
    await el.click();
  }

  // ── Custom select wrapper (handles Radix/MUI/Headless UI variants) ────
  async selectOption(triggerLocator: Locator, optionText: string): Promise<void> {
    await this.select.selectOption(triggerLocator, optionText);
  }

  // ── Row menu helpers (data tables) ────────────────────────────────────
  async openRowMenu(rowIdentifier: string): Promise<void> {
    const row = this.page.getByRole('row', { name: new RegExp(escapeRegex(rowIdentifier)) });
    await expect(row).toBeVisible();
    const menuButton = row.getByRole('button', { name: /more|actions|options/i });
    await menuButton.click();
  }

  async clickMenuItem(name: string): Promise<void> {
    const item = this.page.getByRole('menuitem', { name });
    await expect(item).toBeVisible();
    await item.click();
  }

  // ── Dialog convenience ────────────────────────────────────────────────
  confirmDialog(): Promise<void> {
    return this.dialog.confirm();
  }

  cancelDialog(): Promise<void> {
    return this.dialog.cancel();
  }

  // ── Toast convenience ─────────────────────────────────────────────────
  expectToast(text: string | RegExp): Promise<void> {
    return this.toast.expectVisible(text);
  }

  expectNoToast(): Promise<void> {
    return this.toast.expectNone();
  }

  dismissToast(): Promise<void> {
    return this.toast.dismiss();
  }
}

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
