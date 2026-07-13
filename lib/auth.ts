import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { cleanEnv } from './utils';

export type AdminRole = 'admin' | 'super_admin';

const jwtSecret = new TextEncoder().encode(cleanEnv(process.env.ADMIN_JWT_SECRET));

/**
 * Verify the admin JWT cookie on an API request.
 * Returns the payload ({ email, role }) or null when missing/invalid.
 */
export async function verifyAdminRequest(
  req: NextRequest
): Promise<{ email: string; role: AdminRole } | null> {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    return {
      email: (payload.email as string) || '',
      role: (payload.role as AdminRole) || 'admin',
    };
  } catch {
    return null;
  }
}

// Baked-in super admins — sign in with a password (== their email) on /admin/login,
// skipping OTP. Always granted super_admin regardless of the env var.
export const MASTER_ADMIN_EMAILS = [
  'dilith@zuper.co',
  'anandsub@zuper.co',
  'balaje@zuper.co',
  'ramya@zuper.co',
];

export function getSuperAdminEmails(): string[] {
  const fromEnv = cleanEnv(process.env.SUPER_ADMIN_EMAILS)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...MASTER_ADMIN_EMAILS, ...fromEnv]));
}

export function isSuperAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}

export function roleForEmail(email: string): AdminRole {
  return isSuperAdmin(email) ? 'super_admin' : 'admin';
}
