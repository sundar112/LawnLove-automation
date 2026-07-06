import { env } from '../config/env';
import type { RoleKey } from '../config/roles';

/**
 * Persona = a static, role-bound test user that already exists in the target
 * environment. Credentials come ONLY from .env — never hardcoded.
 *
 * To add a role: extend roles.ts AND .env.example AND this map.
 */
export interface Persona {
  role: RoleKey;
  email: string;
  password: string;
}

export const PERSONAS: Partial<Record<RoleKey, Persona>> = {
  user: {
    role: 'user',
    email: env.USER_EMAIL,
    password: env.USER_PASSWORD,
  },
  ...(env.ADMIN_EMAIL && env.ADMIN_PASSWORD
    ? { admin: { role: 'admin', email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } }
    : {}),
};

export const personaFor = (role: RoleKey): Persona | undefined => PERSONAS[role];
