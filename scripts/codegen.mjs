#!/usr/bin/env node
// Launches Playwright codegen at BASE_URL from .env with role-based storage state,
// so `npm run codegen*` opens the app directly instead of a blank page.
// Usage: node scripts/codegen.mjs <user|admin|public> [url-override]
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
dotenv.config({ path: join(ROOT, '.env') });

const STORAGE_BY_ROLE = {
  user: join('auth', 'user.storage.json'),
  admin: join('auth', 'admin.storage.json'),
  public: null,
};

const role = process.argv[2] ?? 'public';
if (!(role in STORAGE_BY_ROLE)) {
  console.error(`codegen: unknown role "${role}". Expected one of: user, admin, public.`);
  process.exit(1);
}

const url = process.argv[3] ?? process.env.BASE_URL;
if (!url) {
  console.error('codegen: no URL given and BASE_URL is not set in .env — opening blank page.');
}

const args = ['codegen', '--output=scripts/recorded-flow.ts'];

const storage = STORAGE_BY_ROLE[role];
if (storage) {
  if (!existsSync(join(ROOT, storage))) {
    console.error(
      `codegen: ${storage} not found. Run any test once (e.g. \`npm run test:smoke\`) ` +
        'so auth.setup.ts generates the storage state, then retry.',
    );
    process.exit(1);
  }
  args.push(`--load-storage=${storage}`);
}

if (url) args.push(url);

// Resolve the Playwright CLI directly instead of shelling out to npx —
// avoids Windows .cmd spawn issues and works identically on every platform.
const require = createRequire(import.meta.url);
const cli = require.resolve('@playwright/test/cli', { paths: [ROOT] });

console.log(`codegen: role=${role}${url ? ` url=${url}` : ''}`);
const child = spawn(process.execPath, [cli, ...args], { cwd: ROOT, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
