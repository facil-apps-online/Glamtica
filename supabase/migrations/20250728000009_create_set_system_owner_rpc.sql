-- Migration: 20250728000009_create_set_system_owner_rpc.sql
-- Description: Creates the RPC function to safely set a new system owner for a platform,
-- ensuring atomicity and the "one owner per platform" rule.

CREATE OR REPLACE FUNCTION set_system_owner(
    p_new_owner_tenant_id UUID,
    p_platform_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Step 1: Unset the previous owner for the given platform.
    -- This ensures that there are no multiple owners.
    UPDATE public.tenants
    SET is_system_owner = false
    WHERE platform_id = p_platform_id AND is_system_owner = true;

    -- Step 2: Set the new owner for the platform.
    UPDATE public.tenants
    SET is_system_owner = true
    WHERE id = p_new_owner_tenant_id;
END;
$$;
