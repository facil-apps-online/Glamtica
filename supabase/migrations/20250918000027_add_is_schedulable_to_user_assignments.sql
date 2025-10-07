-- Migration to add is_schedulable to user_assignments table
ALTER TABLE public.user_assignments
ADD COLUMN IF NOT EXISTS is_schedulable BOOLEAN NOT NULL DEFAULT true;
