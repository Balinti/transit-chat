import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration for shared auth
const SUPABASE_URL = 'https://api.srv936332.hstgr.cloud';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
export const APP_SLUG = 'transit-chat';

// Client-side Supabase client (uses anon key) - lazy initialization
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

// For backwards compatibility - lazily creates client
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  from(table: string) {
    return getSupabase().from(table);
  },
};

// Track user login - upserts to user_tracking table
export async function trackUserLogin(userEmail: string): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  try {
    // Try to update existing record first
    const { data: existing } = await supabase
      .from('user_tracking')
      .select('login_cnt')
      .eq('user_email', userEmail)
      .eq('app', APP_SLUG)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('user_tracking')
        .update({
          login_cnt: existing.login_cnt + 1,
          last_login_ts: now,
        })
        .eq('user_email', userEmail)
        .eq('app', APP_SLUG);
    } else {
      // Insert new record
      await supabase.from('user_tracking').insert({
        user_email: userEmail,
        app: APP_SLUG,
        login_cnt: 1,
        last_login_ts: now,
      });
    }
  } catch (error) {
    console.error('Failed to track user login:', error);
  }
}

// Server-side Supabase client (uses service role key)
export function getServiceSupabase(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Check if Supabase is configured - always true now with hardcoded values
export function isSupabaseConfigured(): boolean {
  return true;
}
