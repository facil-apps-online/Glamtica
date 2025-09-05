-- Migration: Resolve function overloading by dropping the obsolete version of get_attentions_with_details that uses timestamptz for date parameters.

DROP FUNCTION IF EXISTS public.get_attentions_with_details(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_user_id uuid,
  p_status_filter text,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
) CASCADE;
