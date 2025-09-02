-- Migration: 20250821000029_fix_turns_stylist_id_fkey.sql
-- Description: Fixes the foreign key for turns.stylist_id to reference auth.users.id.

ALTER TABLE public.turns
DROP CONSTRAINT IF EXISTS turns_stylist_id_fkey;

ALTER TABLE public.turns
ADD CONSTRAINT turns_stylist_id_fkey
FOREIGN KEY (stylist_id) REFERENCES auth.users(id) ON DELETE CASCADE;
