-- Migration to correctly define and implement the setup_tenant_for_new_user RPC.
-- This ensures that when a new tenant is registered, the main branch is created with
-- status = 'active' and activated_at = NOW(), fixing the previous issue.

CREATE OR REPLACE FUNCTION setup_tenant_for_new_user(
    p_user_id UUID,
    p_platform_id UUID,
    p_tenant_data JSONB
)
RETURNS UUID -- Devuelve el ID del nuevo tenant
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id UUID;
    new_branch_id UUID;
BEGIN
    -- 1. Crear el Tenant con los datos del payload
    INSERT INTO public.tenants (
        platform_id,
        name,
        country_id,
        default_language_code,
        default_currency_id,
        default_timezone,
        contact_phone,
        whatsapp_phone,
        commercial_email,
        legal_name,
        tax_id,
        billing_address,
        einvoicing_email,
        physical_address_line1,
        physical_address_line2,
        physical_city,
        physical_state,
        physical_postal_code,
        website,
        latitude,
        longitude,
        subscription_status
    ) VALUES (
        p_platform_id,
        p_tenant_data->>'name',
        (p_tenant_data->>'country_id')::UUID,
        p_tenant_data->>'default_language_code',
        (p_tenant_data->>'default_currency_id')::UUID,
        p_tenant_data->>'default_timezone',
        p_tenant_data->>'contact_phone',
        p_tenant_data->>'whatsapp_phone',
        p_tenant_data->>'commercial_email',
        p_tenant_data->>'legal_name',
        p_tenant_data->>'tax_id',
        p_tenant_data->>'billing_address',
        p_tenant_data->>'einvoicing_email',
        p_tenant_data->>'physical_address_line1',
        p_tenant_data->>'physical_address_line2',
        p_tenant_data->>'physical_city',
        p_tenant_data->>'physical_state',
        p_tenant_data->>'physical_postal_code',
        p_tenant_data->>'website',
        (p_tenant_data->>'latitude')::NUMERIC,
        (p_tenant_data->>'longitude')::NUMERIC,
        'trial'
    ) RETURNING id INTO new_tenant_id;

    -- 2. Crear la sucursal principal para el nuevo tenant
    INSERT INTO public.branches (
        tenant_id,
        name,
        is_main_branch,
        address_line_1,
        city,
        state,
        postal_code,
        country_id,
        status,
        activated_at
    ) VALUES (
        new_tenant_id,
        'Sucursal Principal',
        true,
        p_tenant_data->>'physical_address_line1',
        p_tenant_data->>'physical_city',
        p_tenant_data->>'physical_state',
        p_tenant_data->>'physical_postal_code',
        (p_tenant_data->>'country_id')::UUID,
        'active', -- <-- CORRECCIÓN
        NOW()     -- <-- CORRECCIÓN
    ) RETURNING id INTO new_branch_id;

    -- 3. Devolver el ID del tenant creado
    RETURN new_tenant_id;

EXCEPTION
    WHEN OTHERS THEN
        -- En caso de error, se podría loggear y se relanza para que la Edge Function lo capture
        RAISE;
END;
$$;
