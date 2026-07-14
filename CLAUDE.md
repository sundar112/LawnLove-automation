# Playwright Automation Template — Claude Instructions

## Automation Workflow (always follow this)

When asked to automate any new feature flow, always use the codegen-first approach:

> ⚠️ **Important:** Claude's terminal is sandboxed and cannot open a GUI browser.
> Claude instructs the user to run codegen; Claude then reads the recording and writes the spec.

### Steps

1. **Tell the user to run** (role-appropriate script from `package.json`):
   - Logged-in user flows: `npm run codegen`
   - Admin flows: `npm run codegen:admin`
   - Public (no auth) flows: `npm run codegen:public`
2. User clicks through the entire feature flow in the opened browser
3. User closes the browser — recording is saved to `scripts/recorded-flow.ts`
4. User says **"done recording"** (or similar)
5. **Claude reads** `scripts/recorded-flow.ts` — use those locators as source of truth
6. **Claude writes** the final clean spec in `src/tests/<feature>.spec.ts` following project conventions

**Why:** Guessing locators from source alone leads to mismatches. Recording live interaction captures exact selectors and surfaces `{ force: true }` / `{ exact: true }` requirements upfront.

The user will trigger this by saying things like:

- "automate the [feature] flow"
- "add automation for [feature]"
- "recreate the [feature] automation"

## Project Conventions

- Auth via storageState — never UI login inside tests (`auth/<role>.storage.json`)
- Zero sleeps — no `waitForTimeout`, use `waitForURL`, `waitForSelector`, `expect().toBeVisible()` instead
- Test tags: `@smoke` (happy path, fast), `@regression` (full flow end-to-end), `@as-user` / `@as-admin` / `@as-public`,
  `@chromium-only` (skip firefox/webkit — for flows with real side effects, e.g. signup creates a user + email per run)
- Each new spec gets 4 matching scripts in `package.json`: `test:<feature>`, `test:<feature>:headed`, `test:<feature>:smoke`, `test:<feature>:regression`
- Shared setup goes in a `goTo<Feature>Page(page: Page)` helper at the top of the spec file
- Page-object assertion helpers must be named `expect*` (e.g. `expectUrl`, `expectToast`) — the
  `playwright/expect-expect` lint rule only recognizes `expect*` and `waitForLoaded` as assertions
- Never assert hardcoded hosts (`toHaveURL(/localhost:3001/)`) — assert paths (`expectUrl(/\/$/)`)
  so specs work against any environment

## Quality Gates

Every commit must pass all four (run them before committing):

```bash
npm run typecheck && npm run lint && npm run lint:no-sleeps && npm run format:check
```

- Pre-commit hook (`.husky/pre-commit`) runs `lint-staged` (Prettier) + grep-bans automatically
- CI runs lint, typecheck, and grep-bans before the tests — a lint failure fails the pipeline
- Line endings are LF everywhere, enforced by `.gitattributes` (`eol=lf`) — do not commit CRLF

## Roles

| Role   | Tag          | Storage file              | Env vars                        |
| ------ | ------------ | ------------------------- | ------------------------------- |
| admin  | `@as-admin`  | `auth/admin.storage.json` | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| user   | `@as-user`   | `auth/user.storage.json`  | `USER_EMAIL`, `USER_PASSWORD`   |
| public | `@as-public` | (none — no auth needed)   | (none)                          |

To add a new role: extend `src/config/roles.ts`, add credentials to `.env.example` + `.env`,
add a persona in `src/fixtures/personas.ts`, and add a project in `playwright.config.ts`.

## Known Gotchas

- Radix UI cards have `absolute inset-0` overlay divs — use `.click({ force: true })` to bypass pointer interception
- Radix Accordion `type="single"` keeps ALL panels in DOM (CSS hidden) — causes strict-mode violations on shared placeholders; use unique per-item selectors or scope to the open panel
- `getByPlaceholder('Email')` partially matches `"Email address"` — always add `{ exact: true }` for short placeholder strings
- Calendar nav buttons often use `aria-label` with specific capitalisation — record to find the exact string
- Gmail's IMAP SEARCH does not reliably match `+` aliases — `src/utils/email.ts` matches To headers
  client-side via envelope fetch instead. Never switch it back to `client.search({ to })`
- `getByRole('link', { name: 'Sign up' })` substring-matches the navbar "Log in / Sign up" link —
  use `{ exact: true }` (role-name matching is substring by default)
- The staging backend rate-limits `/api/auth` bursts (429 "Too many requests") — magic-link opens
  retry with backoff (`openMagicLink`), signup submits retry in `signUpToCheckEmail`, and the
  link-consuming set-password tests run serialized in a `mode: 'default'` describe group.
  Keep new email-consuming tests inside that group

## File Structure

```
src/
  api/           HTTP client (createHttpClient, ApiError)
  config/        env.ts, roles.ts, timeouts.ts
  fixtures/      personas.ts (role → credentials map)
  pages/
    base.page.ts              BasePage abstract class
    components/               Shared UI components (toast, dialog, select, breadcrumb, etc.)
    <feature>.page.ts         One file per page / feature
  tests/
    auth.setup.ts             Auth bootstrap (runs before role projects)
    <feature>.spec.ts         One spec file per feature
  utils/         locators, logger, retry, time, unique, email (IMAP verification-link fetcher)
scripts/
  recorded-flow.ts     Codegen output (overwritten each run, not committed)
  codegen.mjs          Codegen launcher — opens BASE_URL from .env with role storage state
  grep-bans.mjs        Static analysis for banned patterns
  check-imap.ts        Debug gate: proves Gmail IMAP auth works
  check-email-flow.ts  Debug gate: proves the verification-email fetch (optional address arg)
```
