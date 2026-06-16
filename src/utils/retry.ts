import { childLogger } from './logger';

const log = childLogger('retry');

export interface RetryOptions {
  /** Total attempts including the first one. */
  attempts?: number;
  /** Initial delay in ms before the first retry. */
  baseDelayMs?: number;
  /** Multiplier applied per attempt (exponential backoff). */
  factor?: number;
  /** Hard cap for any single delay. */
  maxDelayMs?: number;
  /** Optional predicate — return true to retry, false to abort. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  /** Optional label for log lines. */
  label?: string;
}

const sleep = (ms: number): Promise<void> =>
  // setTimeout is allowed ONLY here, in retry.ts, because it backs all retry
  // logic. Tests must NOT call sleep / waitForTimeout directly.
  // eslint-disable-next-line no-restricted-syntax
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry an async operation with exponential backoff.
 * Reserved for non-UI flakiness (network, API). Never use to "wait" in UI tests.
 */
export const retry = async <T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> => {
  const {
    attempts = 3,
    baseDelayMs = 200,
    factor = 2,
    maxDelayMs = 5_000,
    shouldRetry = () => true,
    label = 'op',
  } = opts;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !shouldRetry(err, attempt)) {
        throw err;
      }
      const delay = Math.min(baseDelayMs * factor ** (attempt - 1), maxDelayMs);
      log.warn(
        { label, attempt, attempts, delayMs: delay, err: errorMessage(err) },
        'retry: attempt failed; backing off',
      );
      await sleep(delay);
    }
  }
  throw lastErr;
};

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));
