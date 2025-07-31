DROP FUNCTION IF EXISTS public.get_tenant_branches(UUID);

CREATE OR REPLACE FUNCTION public.get_tenant_branches(
    p_tenant_id UUID
)
RETURNS SETOF public.branches
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    tenant_id,
    name,
    address,
    created_at,
    updated_at,
    language_code,
    currency_id,
    timezone,
    is_main_branch,
    status,
    activated_at,
    contact_phone,
    whatsapp_phone,
    commercial_email,
    website,
    physical_address_line1,
    physical_address_line2,
    physical_city,
    physical_state,
    physical_postal_code,
    latitude,
    longitude
  FROM public.branches
  WHERE tenant_id = p_tenant_id
  ORDER BY is_main_branch DESC, name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_branches(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_tenant_branches(UUID) IS 'Returns all branches for a given tenant, including new detailed fields.';