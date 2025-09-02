-- Migration: 20250821000030_fix_equipment_assignments_user_id_fkey.sql
-- Description: Fixes the foreign key for equipment_assignments.user_id to reference auth.users(id).

ALTER TABLE public.equipment_assignments
DROP CONSTRAINT IF EXISTS equipment_assignments_user_id_fkey;

ALTER TABLE public.equipment_assignments
ADD CONSTRAINT equipment_assignments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
