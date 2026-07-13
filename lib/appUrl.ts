import { headers } from 'next/headers';
import { cleanEnv } from './utils';

/**
 * Server-only base URL for building customer links. Prefers
 * NEXT_PUBLIC_APP_URL; falls back to the request's own host — never
 * localhost — so copied links stay valid even if the env var drops.
 */
export function getAppUrl(): string {
  const fromEnv = cleanEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'compass-zuper.vercel.app';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}
