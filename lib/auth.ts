import { cleanEnv } from './utils';

export type AdminRole = 'admin' | 'super_admin';

export function getSuperAdminEmails(): string[] {
  return cleanEnv(process.env.SUPER_ADMIN_EMAILS)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}

export function roleForEmail(email: string): AdminRole {
  return isSuperAdmin(email) ? 'super_admin' : 'admin';
}
