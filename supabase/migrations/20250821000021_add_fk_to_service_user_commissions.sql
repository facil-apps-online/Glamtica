-- This migration adds the foreign key constraint from service_user_commissions.user_id to auth.users.id
-- This is intended to fix the "Could not find a relationship" error.

ALTER TABLE public.service_user_commissions
ADD CONSTRAINT service_user_commissions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
