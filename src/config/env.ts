import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load .env from the project root (two levels up from src/config/), not the
// current working directory — so tests can be launched from any folder.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

/**
 * Zod-validated environment loader. Throws a readable error listing every
 * missing or invalid variable. Imported once at startup by playwright.config.ts.
 *
 * To add a new env var: extend EnvSchema below, then add a documented entry
 * to .env.example AND .env (the latter is gitignored).
 */

const boolean = z
  .string()
  .transform((v) => v.toLowerCase() === 'true')
  .pipe(z.boolean());

const positiveInt = z
  .string()
  .regex(/^\d+$/, 'must be a non-negative integer')
  .transform((v) => Number.parseInt(v, 10));

const traceEnum = z.enum(['off', 'on', 'retain-on-failure', 'on-first-retry']);
const videoEnum = z.enum(['off', 'on', 'retain-on-failure']);
const screenshotEnum = z.enum(['off', 'on', 'only-on-failure']);
const logLevelEnum = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);

const EnvSchema = z.object({
  BASE_URL: z.url('BASE_URL must be a valid URL (e.g. http://localhost:3000)'),
  API_URL: z.url('API_URL must be a valid URL'),

  /** Required for role-based tests; optional when running public-only suites. */
  USER_EMAIL: z.string().optional().default(''),
  USER_PASSWORD: z.string().optional().default(''),

  /** Optional — only needed if the app has an admin role. Leave blank to skip admin auth setup. */
  ADMIN_EMAIL: z.string().optional().default(''),
  ADMIN_PASSWORD: z.string().optional().default(''),

  HEADLESS: boolean,
  SLOW_MO: positiveInt,
  WORKERS: positiveInt,
  RETRIES: positiveInt,
  TRACE: traceEnum,
  VIDEO: videoEnum,
  SCREENSHOT: screenshotEnum,
  DEFAULT_TIMEOUT_MS: positiveInt,
  NAVIGATION_TIMEOUT_MS: positiveInt,
  EXPECT_TIMEOUT_MS: positiveInt,

  TAGS: z.string().optional().default(''),
  LOG_LEVEL: logLevelEnum.default('info'),

  DEBUG_PROTOCOL: boolean.default(false),
  TRACE_NETWORK: boolean.default(false),
  /** After a test: open inspector and keep browser until you resume. Local only; keep false in CI. */
  E2E_PAUSE_AFTER_TEST: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean()),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => ` - ${i.path.join('.') || '<root>'}: ${i.message}`)
    .join('\n');
  console.error(
    [
      '',
      'Environment validation failed.',
      '  Make sure your .env file is complete (compare against .env.example).',
      '',
      issues,
      '',
    ].join('\n'),
  );
  throw new Error('Invalid environment configuration. See errors above.');
}

export const env: Env = parsed.data;
