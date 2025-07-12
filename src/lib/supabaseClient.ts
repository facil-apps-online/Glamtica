import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Ensure the client is only created once, especially in development with HMR
let supabaseClient: ReturnType<typeof createClient<Database>>;

if (import.meta.env.DEV && globalThis.supabase) {
  supabaseClient = globalThis.supabase as ReturnType<typeof createClient<Database>>;
} else {
  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false, // We manage session manually
      detectSessionInUrl: false, // We manage session manually
    },
  });
  if (import.meta.env.DEV) {
    globalThis.supabase = supabaseClient;
  }
}

export const supabase = supabaseClient;

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