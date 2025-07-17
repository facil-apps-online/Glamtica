-- This migration re-adds the first_name and last_name columns to the public.users table.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;
