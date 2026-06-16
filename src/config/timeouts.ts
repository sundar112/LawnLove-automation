/**
 * Named timeout constants. Replaces magic numbers throughout the suite.
 * All values are in milliseconds.
 */
export const TIMEOUTS = {
  /** Per-test default budget. Increase only with justification. */
  testTimeoutMs: 60_000,

  /** Single quick UI action (a click that opens a popover, etc.). */
  uiActionShortMs: 5_000,

  /** Standard UI wait — most assertions use this implicitly via expect.timeout. */
  uiActionStandardMs: 15_000,

  /** Long UI wait — large lists, heavy renders. Use sparingly. */
  uiActionLongMs: 30_000,

  /** Single API call. */
  apiCallMs: 10_000,

  /** Background polling for async backend work (job done, file ready). */
  asyncJobPollMs: 60_000,

  /** Auth/storageState bootstrap window. */
  authBootstrapMs: 30_000,
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
