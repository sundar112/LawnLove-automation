# Playwright Automation Template

A production-ready Playwright + TypeScript E2E automation template. Clone this repo to start automating any web app in minutes.

## What's included

- **Page Object Model** — `BasePage` abstract class with built-in helpers (fill, click, toast, dialog, select, breadcrumb)
- **Reusable components** — Toast, Dialog, Select, Breadcrumb, DataTable, SideMenu
- **Role-based auth** — storageState caching per role (admin, user) so tests skip the login UI
- **HTTP client** — ky-based client with retry, bearer token injection, and structured errors
- **Utilities** — logger (pino), retry with exponential backoff, unique test data generators
- **CI/CD** — GitHub Actions pipeline with Slack failure notifications
- **Code quality** — ESLint (Playwright rules + TypeScript), Prettier, Husky pre-commit hook (lint-staged + grep-bans), and the same gates enforced in CI

## Quick start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd <project>
npm install
npx playwright install --with-deps chromium

# 2. Configure environment
cp .env.example .env
# Fill in BASE_URL, API_URL, and test user credentials

# 3. Run auth setup (saves storageState files)
npx playwright test src/tests/auth.setup.ts

# 4. Run the example spec
npm run test:example
```

## New project setup

For a complete step-by-step guide to reuse this template in a new project, see **[NEW-PROJECT-SETUP.md](./NEW-PROJECT-SETUP.md)** — covers environment setup, adapting the auth flow, deleting example files, CI secrets, adding roles, and a full troubleshooting section for auth failures.

## Adapting for a new project

1. **Update roles** — edit `src/config/roles.ts` to match your app's user types
2. **Update env** — add/remove credential vars in `src/config/env.ts` and `.env.example`
3. **Update auth setup** — edit `src/tests/auth.setup.ts` to match your login page locators
4. **Delete the example** — remove `src/pages/example.page.ts` and `src/tests/example.spec.ts`
5. **Update codegen scripts** — set the target URL in `package.json` codegen scripts

## Adding a new feature spec

```bash
# 1. Record the flow
npm run codegen       # opens browser as logged-in user

# 2. Write the spec (read recorded-flow.ts for locators)
# src/tests/<feature>.spec.ts

# 3. Add npm scripts in package.json
# test:<feature>, test:<feature>:headed, test:<feature>:smoke, test:<feature>:regression
```

## Available scripts

| Script                    | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `npm test`                | Run all tests                                   |
| `npm run test:smoke`      | Smoke tests only                                |
| `npm run test:regression` | Regression tests only                           |
| `npm run test:ci`         | CI subset (smoke + regression)                  |
| `npm run test:ui`         | Open Playwright UI mode                         |
| `npm run codegen`         | Record a flow as logged-in user                 |
| `npm run codegen:admin`   | Record a flow as admin                          |
| `npm run codegen:public`  | Record a flow without auth                      |
| `npm run report`          | Open last HTML report                           |
| `npm run lint`            | Run ESLint                                      |
| `npm run typecheck`       | TypeScript type check                           |
| `npm run lint:no-sleeps`  | Check banned patterns (sleeps, hardcoded creds) |
| `npm run format:check`    | Verify Prettier formatting                      |

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main`, pull requests, and daily at 2 AM UTC. Quality gates (lint, typecheck, grep-bans) run first — the E2E tests only run if they pass.

Required GitHub secrets:

- `BASE_URL`, `API_URL`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `USER_EMAIL`, `USER_PASSWORD`
- `SLACK_WEBHOOK_URL` (optional — for failure notifications)

Optional GitHub variable:

- `PROJECT_NAME` — displayed in Slack alerts (default: "E2E")
