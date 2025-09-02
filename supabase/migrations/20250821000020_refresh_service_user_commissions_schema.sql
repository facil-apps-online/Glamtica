-- This migration adds a comment to a column in the service_user_commissions table.
-- This is a harmless operation intended to force a schema refresh in PostgREST,
-- which might resolve issues with stale schema cache.

COMMENT ON COLUMN public.service_user_commissions.commission_rate IS 'The commission rate for a user on a specific service and branch.';
