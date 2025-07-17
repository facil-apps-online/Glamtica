-- This migration adds an avatar_url column to the public.users table.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
