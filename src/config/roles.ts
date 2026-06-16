/**
 * Role catalogue. Each entry maps to a persona key in fixtures/personas.ts
 * and gets its own cached storageState file at auth/<role>.storage.json.
 *
 * To add a role: append to ROLES, add credential env vars in .env(.example),
 * add a persona in fixtures/personas.ts, and add a project in playwright.config.ts.
 */
export const ROLES = ['admin', 'user'] as const;

export type RoleKey = (typeof ROLES)[number];

export const isRoleKey = (value: string): value is RoleKey =>
  (ROLES as readonly string[]).includes(value);
