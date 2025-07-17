-- This migration adds first_name and last_name columns to the public.users table.

ALTER TABLE public.users
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;
