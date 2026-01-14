import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key) - lazy initialization
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// For backwards compatibility - lazily creates client
export const supabase = {
  get auth() {
    const client = getSupabase();
    if (!client) {
      throw new Error('Supabase not configured');
    }
    return client.auth;
  },
  from(table: string) {
    const client = getSupabase();
    if (!client) {
      throw new Error('Supabase not configured');
    }
    return client.from(table);
  },
};

// Server-side Supabase client (uses service role key)
export function getServiceSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
