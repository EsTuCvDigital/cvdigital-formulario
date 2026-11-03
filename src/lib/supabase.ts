import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes('TU-PROYECTO') &&
    url.startsWith('https://') &&
    anonKey.length > 20,
);

export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'x-application-name': 'cvdigital-formulario' } },
    })
  : null;
