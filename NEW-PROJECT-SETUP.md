# New Project Setup Guide

Complete step-by-step guide to reuse this template for a new project.

---

## Prerequisites

Make sure you have these installed before starting:

- **Node.js 20+** — check with `node --version`
- **npm** — check with `npm --version`
- **Git** — check with `git --version`

---

## Step 1 — Copy the Template

Do **not** clone this repo. Instead, copy the entire template folder to a new location.

**Example:**
```
From: C:\Users\D E L L\OneDrive\Desktop\Playwrite template
To:   C:\Users\D E L L\OneDrive\Desktop\MyProject-automation
```

Then open a terminal in your new folder and initialise a fresh git repo:

```bash
git init
git add .
git commit -m "init: scaffold from playwright template"
```

---

## Step 2 — Install Dependencies

```bash
npm install
npx playwright install chromium
```

This installs all packages and downloads the Chromium browser Playwright uses.

---

## Step 3 — Create Your `.env` File

Copy the example file:

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Now open `.env` and fill in your project's values:

```env
# Your app's URLs
BASE_URL=https://your-app.com
API_URL=https://your-app.com/api

# Admin user that already exists in the app
ADMIN_EMAIL=admin@your-app.com
ADMIN_PASSWORD=your-admin-password

# Regular user that already exists in the app
USER_EMAIL=user@your-app.com
USER_PASSWORD=your-user-password
```

> The users in `.env` must **already exist** in your app — this template does not create them.
> Leave `TEST_PASSWORD` blank for now unless you have registration test flows.

---

## Step 4 — Rename the Project in `package.json`

Open `package.json` and update the `name` and `description` fields:

```json
{
  "name": "myproject-automation",
  "description": "E2E automation for MyProject."
}
```

---

## Step 5 — Record Your Login Flow

The auth setup needs to know how to log in to **your app**. Use codegen to record it:

```bash
npm run codegen:public
```

A browser opens. Do this:
1. Navigate to your app's login page
2. Type your email and password
3. Click the login / sign in button
4. Wait until you land on the home / dashboard page
5. Close the browser

The recording is saved to `scripts/recorded-flow.ts`. Open that file and look at the selectors it captured — for example:

```ts
await page.goto('https://your-app.com/login');
await page.getByLabel('Email').fill('user@example.com');
await page.getByLabel('Password').fill('secret');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/dashboard');
```

---

## Step 6 — Adapt `src/tests/auth.setup.ts`

Open `src/tests/auth.setup.ts`. Find the block marked `Adapt this block to your app's login UI` and replace it with the selectors from the recording:

**Before (template placeholder):**
```ts
await page.goto('/login');
await page.getByLabel(/email/i).fill(persona.email);
await page.getByLabel(/password/i).fill(persona.password);
await page.getByRole('button', { name: /sign in|log in/i }).click();
await page.waitForURL(/\/(dashboard|home|app)/, { timeout: 30_000 });
```

**After (your app's actual selectors from recording):**
```ts
await page.goto('/login');
await page.getByLabel('Email address').fill(persona.email);   // exact label from recording
await page.getByLabel('Password').fill(persona.password);
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/dashboard', { timeout: 30_000 });   // exact URL pattern from recording
```

> Keep `persona.email` and `persona.password` — do not hardcode credentials here.

---

## Step 7 — Run Auth Setup to Verify Login Works

```bash
npx playwright test src/tests/auth.setup.ts --project=setup
```

Expected output:
```
✓  site reachable
✓  authenticate as admin
✓  authenticate as user
```

If it passes, two files are created:
- `auth/admin.storage.json`
- `auth/user.storage.json`

These store the logged-in browser session so future tests skip the login UI entirely.

**If it fails:** Check your `.env` credentials are correct and your app is running / reachable.

---

## Step 8 — Delete the Example Files

These are template placeholders — delete them:

```bash
# Delete example test and page
src/tests/example.spec.ts
src/pages/example.page.ts
```

Also remove the example scripts from `package.json` (the four `test:example:*` lines):

```json
"test:example": "...",           ← delete
"test:example:headed": "...",    ← delete
"test:example:smoke": "...",     ← delete
"test:example:regression": "...", ← delete
```

---

## Step 9 — Start Automating Your First Feature

Now you are ready. For each new feature flow:

### 9a. Record the flow

```bash
npm run codegen          # for regular user flows
npm run codegen:admin    # for admin flows
npm run codegen:public   # for pages that don't need login
```

Click through the full feature in the browser, then close it.

### 9b. Tell Claude "done recording"

Claude reads `scripts/recorded-flow.ts` and writes a clean spec in `src/tests/<feature>.spec.ts` using the exact selectors from your recording.

### 9c. Add npm scripts for the new spec

Each new spec gets 4 scripts in `package.json`. Example for a `products` feature:

```json
"test:products":            "playwright test src/tests/products.spec.ts",
"test:products:headed":     "cross-env HEADLESS=false playwright test src/tests/products.spec.ts --headed --workers=1",
"test:products:smoke":      "playwright test src/tests/products.spec.ts --grep @smoke",
"test:products:regression": "playwright test src/tests/products.spec.ts --grep @regression"
```

---

## Step 10 — Set Up GitHub Actions (Optional)

If you want CI to run your tests automatically on every push:

1. Push your code to a GitHub repository
2. Go to **Settings → Secrets and variables → Actions**
3. Add these repository secrets:

| Secret | Value |
|--------|-------|
| `BASE_URL` | Your app's URL |
| `API_URL` | Your app's API URL |
| `ADMIN_EMAIL` | Admin user email |
| `ADMIN_PASSWORD` | Admin user password |
| `USER_EMAIL` | Regular user email |
| `USER_PASSWORD` | Regular user password |
| `SLACK_WEBHOOK_URL` | Slack webhook URL (optional — for failure alerts) |

4. Go to **Settings → Variables → Actions** and add:

| Variable | Value |
|----------|-------|
| `PROJECT_NAME` | Your project name (e.g. `MyProject`) |

The workflow at `.github/workflows/ci.yml` will run automatically on every push to `main`.

---

## Daily Usage

Once set up, your day-to-day commands are:

```bash
# Run all tests
npm test

# Run only smoke tests (fast)
npm run test:smoke

# Run a specific feature
npm run test:products

# Debug a failing test (opens browser)
npm run test:products:headed

# Run a new codegen recording
npm run codegen

# Check for banned patterns (no sleeps, no hardcoded creds)
npm run lint:no-sleeps

# View last test report
npm run report
```

---

## Adding a New Role (e.g. `manager`)

If your app has more than admin and user roles:

1. **`src/config/roles.ts`** — add to ROLES array:
   ```ts
   export const ROLES = ['admin', 'user', 'manager'] as const;
   ```

2. **`.env.example` and `.env`** — add credentials:
   ```env
   MANAGER_EMAIL=
   MANAGER_PASSWORD=
   ```

3. **`src/config/env.ts`** — add env vars to the Zod schema (follow the existing `ADMIN_EMAIL` pattern)

4. **`src/fixtures/personas.ts`** — add persona:
   ```ts
   manager: {
     role: 'manager',
     email: env.MANAGER_EMAIL,
     password: env.MANAGER_PASSWORD,
   }
   ```

5. **`playwright.config.ts`** — add project:
   ```ts
   {
     name: 'chromium-manager',
     testIgnore: /auth\.setup\.ts/,
     grep: /@as-manager\b/,
     dependencies: ['setup'],
     use: {
       ...devices['Desktop Chrome'],
       storageState: storagePath('manager'),
     },
   }
   ```

6. Tag your tests with `@as-manager` and auth setup handles the rest automatically.

---

## Troubleshooting

### Auth Setup Failures

Run auth setup in headed mode so you can see exactly what is happening in the browser:

```bash
cross-env HEADLESS=false npx playwright test src/tests/auth.setup.ts --project=setup
```

---

**`Error: BASE_URL is required` or `Error: Missing environment variables`**

You have not created a `.env` file, or it is missing required values.

```bash
copy .env.example .env   # Windows
cp .env.example .env     # Mac / Linux
```

Then open `.env` and fill in `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, `USER_PASSWORD`.

---

**"Login page unreachable — check BASE_URL"**

The `site reachable` test failed. Causes:
- `BASE_URL` in `.env` has a typo (e.g. missing `https://`, extra trailing slash)
- The app is not running — start it first, then run auth setup
- The app is behind a VPN — connect to VPN first
- The login route is not `/login` — update `auth.setup.ts` line `await page.goto('/login')` to match your actual login path (e.g. `/auth/signin`, `/accounts/login`)

---

**"Locator not found" or "Element not visible" on the email / password field**

The selector in `auth.setup.ts` does not match your app's login form.

1. Run codegen to capture the exact selectors:
   ```bash
   npm run codegen:public
   ```
2. On the login page, type your email and password, click the button
3. Close the browser — open `scripts/recorded-flow.ts`
4. Copy the exact `fill` and `click` lines into `auth.setup.ts`

Common mismatches:
- App uses `placeholder="Email address"` but selector is `getByLabel('Email')` — use `getByPlaceholder('Email address', { exact: true })` instead
- App uses a custom input component not tied to a `<label>` — use `getByTestId(...)` or `getByPlaceholder(...)`
- Login form is inside a modal/dialog — scope the locator: `page.getByRole('dialog').getByLabel('Email')`

---

**"Locator matched multiple elements" on the login button**

Your app has more than one button matching the pattern `/sign in|log in/i` (e.g. a nav button and the form submit button).

Use a more specific selector:
```ts
// Scope to the form
await page.getByRole('form').getByRole('button', { name: /sign in/i }).click();

// Or use exact match
await page.getByRole('button', { name: 'Sign in', exact: true }).click();

// Or use data-testid if available
await page.getByTestId('login-submit-btn').click();
```

---

**`waitForURL` times out after clicking login**

The login succeeded visually but `waitForURL` pattern does not match what the app navigates to.

1. In headed mode, watch the browser URL bar after clicking login
2. Copy the exact URL (e.g. `https://your-app.com/projects/123/overview`)
3. Update `waitForURL` in `auth.setup.ts` to match:
   ```ts
   // Glob pattern — matches any path after the domain
   await page.waitForURL('**/projects/**', { timeout: 30_000 });

   // Or exact URL
   await page.waitForURL('https://your-app.com/dashboard', { timeout: 30_000 });

   // Or regex
   await page.waitForURL(/\/(dashboard|home|projects)/, { timeout: 30_000 });
   ```

---

**Auth setup passes but all tests fail with 401 / redirected to login**

The `storageState` was saved but is not being loaded correctly.

Check:
- `auth/admin.storage.json` and `auth/user.storage.json` exist (if not, auth setup did not actually save them)
- The files are not empty — open one and confirm it contains cookies/localStorage data
- Your app uses a different domain in staging vs local — `storageState` cookies are domain-scoped; if `BASE_URL` changed since you ran auth setup, re-run auth setup

Re-run auth setup fresh:
```bash
npm run clean          # deletes auth/*.storage.json
npx playwright test src/tests/auth.setup.ts --project=setup
```

---

**Auth setup passes locally but fails in CI**

- Secrets not added to GitHub — go to **Settings → Secrets → Actions** and verify all 6 secrets are set (`BASE_URL`, `API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, `USER_PASSWORD`)
- App is not accessible from GitHub's runners — the app must be publicly reachable or you need a tunnel (e.g. ngrok) for CI
- MFA / 2FA is enabled on the test accounts — test accounts must have MFA disabled

---

**`storageState` expires mid-run and tests start failing after some time**

Your app's session tokens have a short expiry (e.g. 15 minutes). Options:
- Use test accounts with longer session duration / "remember me" enabled
- Add a `beforeEach` hook in affected specs that re-navigates to trigger a token refresh
- Re-run auth setup as part of CI before every test run (already the default in the CI workflow)

---

### General Troubleshooting

**`Error: BASE_URL is required`**
→ You have not created a `.env` file. Run `copy .env.example .env` and fill in the values.

**`waitForTimeout is not allowed`**
→ The linter bans all sleeps. Use `expect(locator).toBeVisible()` or `waitForURL()` instead.

**`getByPlaceholder('Email')` matches multiple elements**
→ Use `{ exact: true }` — `getByPlaceholder('Email', { exact: true })`. Short placeholder strings partially match longer ones.

---

## File Structure Reference

```
your-project-automation/
├── auth/                        ← auto-created; storageState files go here (gitignored)
├── scripts/
│   └── recorded-flow.ts         ← codegen output; read this, then write your spec
├── src/
│   ├── api/
│   │   └── http-client.ts       ← reusable HTTP client for API calls in tests
│   ├── config/
│   │   ├── env.ts               ← all env vars validated here
│   │   ├── roles.ts             ← role list — extend to add new roles
│   │   └── timeouts.ts          ← named timeout constants
│   ├── fixtures/
│   │   └── personas.ts          ← role → credentials map
│   ├── pages/
│   │   ├── base.page.ts         ← base class — all page objects extend this
│   │   ├── components/          ← shared UI components (toast, dialog, table, etc.)
│   │   └── <feature>.page.ts    ← one file per page/feature — you create these
│   ├── tests/
│   │   ├── auth.setup.ts        ← login flow — adapt in Step 6
│   │   └── <feature>.spec.ts    ← one spec per feature — you create these
│   └── utils/                   ← logger, retry, unique data, locator helpers
├── .env.example                 ← template for .env — commit this, never .env
├── .env                         ← your real credentials — gitignored
└── playwright.config.ts         ← main config — rarely needs changes
```
