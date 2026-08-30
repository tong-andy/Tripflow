import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let client: SupabaseClient<Database> | undefined;

function readSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase 配置缺失。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。',
    );
  }

  return { url, publishableKey };
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    const { url, publishableKey } = readSupabaseConfig();
    client = createClient<Database>(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: 'tripflow:supabase-auth',
      },
    });
  }

  return client;
}
