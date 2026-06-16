import { randomUUID } from 'node:crypto';

/**
 * Short run id (8 chars) suitable for suffixing user-visible test data.
 * Generated fresh per call — wrap once at the top of a test for stability.
 */
export const testRunId = (): string => randomUUID().slice(0, 8);

/**
 * Returns a deterministic, collision-resistant suffix per test.
 * Pair with a stable label, e.g. `testEmail('admin')`.
 */
export const testEmail = (prefix: string, runId: string = testRunId()): string =>
  `${prefix}-${runId}@example.test`;

/**
 * Generic suffix helper: `unique('Project Alpha')` → `Project Alpha [a1b2c3d4]`
 */
export const unique = (label: string, runId: string = testRunId()): string => `${label} [${runId}]`;

/**
 * Random integer in [min, max] inclusive.
 */
export const randomInt = (min: number, max: number): number => {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
};
