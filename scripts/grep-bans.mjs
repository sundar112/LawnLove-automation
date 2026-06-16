#!/usr/bin/env node
// Enforces no-sleeps, no class-based xpath, no hardcoded creds.
// Pure Node — no external dependencies — so it can run in any CI environment.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src'];

const BAN_RULES = [
  {
    id: 'no-waitForTimeout',
    description: 'page.waitForTimeout() / sleep / setTimeout banned. Use auto-retrying expect() instead.',
    pattern: /\b(waitForTimeout|setTimeout)\s*\(/g,
    skipFiles: [
      // Allowed only inside the retry helper (sole controlled use).
      join('src', 'utils', 'retry.ts'),
    ],
  },
  {
    id: 'no-class-xpath',
    description: 'XPath that depends on CSS class names banned.',
    pattern: /By\.xpath|contains\(@class/g,
    skipFiles: [],
  },
  {
    id: 'no-hardcoded-creds',
    description: 'hardcoded credentials in tests/specs banned.',
    pattern: /Test@123|Password1!|admin@example\.com.*['"][a-zA-Z0-9!@#$%]{4,}['"]/g,
    onlyDirs: [join('src', 'tests'), join('src', 'features'), join('src', 'step-definitions')],
    skipFiles: [],
  },
];

const SKIP_DIR_NAMES = new Set(['node_modules', 'reports', 'auth', 'dist', 'build']);

const TEXT_EXT = new Set(['.ts', '.js', '.cjs', '.mjs', '.feature', '.json', '.md']);

const walk = async (dir) => {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      const ext = entry.name.includes('.') ? entry.name.slice(entry.name.lastIndexOf('.')) : '';
      if (TEXT_EXT.has(ext)) {
        const s = await stat(full);
        if (s.size < 1_000_000) out.push(full);
      }
    }
  }
  return out;
};

const inAllowedDir = (file, allowedDirs) => {
  if (!allowedDirs || allowedDirs.length === 0) return true;
  const rel = relative(ROOT, file);
  return allowedDirs.some((d) => rel.startsWith(d + sep) || rel === d);
};

const main = async () => {
  const failures = [];
  const files = (await Promise.all(SCAN_DIRS.map((d) => walk(join(ROOT, d))))).flat();

  for (const file of files) {
    const rel = relative(ROOT, file);
    const content = await readFile(file, 'utf8');
    for (const rule of BAN_RULES) {
      if (rule.skipFiles.includes(rel)) continue;
      if (!inAllowedDir(file, rule.onlyDirs)) continue;
      const matches = [...content.matchAll(rule.pattern)];
      if (matches.length > 0) {
        for (const m of matches) {
          const upTo = content.slice(0, m.index ?? 0);
          const line = upTo.split(/\r?\n/).length;
          failures.push({ rule, file: rel, line, snippet: m[0] });
        }
      }
    }
  }

  if (failures.length === 0) {
    console.log('grep-bans: clean (0 violations)');
    return;
  }

  console.error(`grep-bans: ${failures.length} violation(s) found:`);
  for (const f of failures) {
    console.error(`  [${f.rule.id}] ${f.file}:${f.line}  →  ${f.snippet}`);
    console.error(`           ${f.rule.description}`);
  }
  process.exitCode = 1;
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 2;
});
