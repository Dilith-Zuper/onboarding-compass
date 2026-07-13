import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cleanEnv } from '@/lib/utils';

export function createClient() {
  return createSupabaseClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    {
      global: {
        // Next.js 14 patches fetch with a data cache that can serve stale
        // PostgREST GET responses inside route handlers — observed in prod:
        // a submitted session reverted to in_progress off a stale 'pending'
        // read. Every Supabase call must bypass the cache.
        fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  );
}
