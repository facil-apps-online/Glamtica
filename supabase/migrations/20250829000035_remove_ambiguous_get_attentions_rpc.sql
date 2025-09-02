-- This migration removes the ambiguous version of the get_attentions_with_details function
-- that was causing a "could not choose best candidate function" error.
-- We are keeping the version that uses timestamptz for date ranges.

DROP FUNCTION IF EXISTS public.get_attentions_with_details(p_tenant_id uuid, p_branch_id uuid, p_user_id uuid, p_status_filter text, p_start_date date, p_end_date date);
