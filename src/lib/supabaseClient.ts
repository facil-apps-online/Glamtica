import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const CORE_SUPABASE_URL = import.meta.env.VITE_CORE_SUPABASE_URL;
const CORE_SUPABASE_ANON_KEY = import.meta.env.VITE_CORE_SUPABASE_ANON_KEY;


// Client for the per-tenant database
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Client for the central Core database
export const coreSupabase = createClient(CORE_SUPABASE_URL, CORE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Core client typically won't manage user sessions
    autoRefreshToken: false,
  },
});

// Asegurar que supabase.global y supabase.global.headers existan
if (!supabase.global) {
  supabase.global = {};
}
if (!supabase.global.headers) {
  supabase.global.headers = {};
}

// Ensure coreSupabase.global headers exist, copying auth from the main client
if (!coreSupabase.global) {
  coreSupabase.global = {};
}
coreSupabase.global.headers = supabase.global.headers;

// The following utility functions remain unchanged.
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Utility function to convert a local date to UTC string for Supabase
export const toUTC = (date: Date, timeZone: string): Date => {
  return fromZonedTime(date, timeZone);
};

// Utility function to convert a UTC date string from Supabase to a zoned date
export const fromUTC = (utcDateString: string, timeZone: string): Date => {
  const utcDate = new Date(utcDateString);
  return toZonedTime(utcDate, timeZone);
};