import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

// Lazy singleton — only instantiated on first request, not at build time.
// This prevents the Vercel build from crashing when env vars are absent.
export const supabaseServerClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
          'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
        );
      }

      _client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    const value = (_client as any)[prop];
    return typeof value === 'function' ? value.bind(_client) : value;
  },
});
