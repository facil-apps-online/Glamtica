-- Migration to update the setup_tenant_for_new_user RPC.
-- This version ensures the 'address' column in the branches table is populated
-- with the formatted address from the frontend, or a concatenated address as fallback.

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
    v_formatted_address TEXT;
    v_concatenated_address TEXT;
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

    -- Construir la dirección para la columna 'address' de la tabla branches
    v_formatted_address := p_tenant_data->>'formatted_address';
    v_concatenated_address := TRIM(CONCAT_WS(', ',
        p_tenant_data->>'physical_address_line1',
        p_tenant_data->>'physical_address_line2',
        p_tenant_data->>'physical_city',
        p_tenant_data->>'physical_state',
        p_tenant_data->>'physical_postal_code'
    ));

    -- 2. Crear la sucursal principal para el nuevo tenant
    INSERT INTO public.branches (
        tenant_id,
        name,
        is_main_branch,
        address, -- <-- Aquí se inserta la dirección formateada o concatenada
        physical_address_line1,
        physical_address_line2,
        physical_city,
        physical_state,
        physical_postal_code,
        status,
        activated_at,
        contact_phone,
        whatsapp_phone,
        commercial_email,
        website,
        latitude,
        longitude
    ) VALUES (
        new_tenant_id,
        'Sucursal Principal',
        true,
        COALESCE(v_formatted_address, v_concatenated_address), -- Usar formatted_address o el concatenado como fallback
        p_tenant_data->>'physical_address_line1',
        p_tenant_data->>'physical_address_line2',
        p_tenant_data->>'physical_city',
        p_tenant_data->>'physical_state',
        p_tenant_data->>'physical_postal_code',
        'active',
        NOW(),
        p_tenant_data->>'contact_phone',
        p_tenant_data->>'whatsapp_phone',
        p_tenant_data->>'commercial_email',
        p_tenant_data->>'website',
        (p_tenant_data->>'latitude')::NUMERIC,
        (p_tenant_data->>'longitude')::NUMERIC
    ) RETURNING id INTO new_branch_id;

    -- 3. Devolver el ID del tenant creado
    RETURN new_tenant_id;

EXCEPTION
    WHEN OTHERS THEN
        -- En caso de error, se podría loggear y se relanza para que la Edge Function lo capture
        RAISE;
END;
$$;
