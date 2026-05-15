import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cleanEnv } from '@/lib/utils';

export function createClient() {
  return createSupabaseClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
