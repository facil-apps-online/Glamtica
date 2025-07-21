CREATE OR REPLACE FUNCTION upsert_integration_provider(
    p_id UUID,
    p_name TEXT,
    p_logo_url TEXT,
    p_country_id UUID,
    p_category_id UUID,
    p_status TEXT,
    p_endpoints JSONB,
    p_config_schema JSONB,
    p_api_schema JSONB
)
RETURNS SETOF integration_providers
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- La seguridad se maneja a nivel de RLS en la tabla integration_providers.
    -- Si el usuario no es superadmin, la política de INSERT/UPDATE fallará.
    RETURN QUERY
    INSERT INTO integration_providers (
        id, name, logo_url, country_id, category_id, status, endpoints, config_schema, api_schema
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_name,
        p_logo_url,
        p_country_id,
        p_category_id,
        p_status,
        p_endpoints,
        p_config_schema,
        p_api_schema
    )
    ON CONFLICT (id) DO UPDATE SET
        name = p_name,
        logo_url = p_logo_url,
        country_id = p_country_id,
        category_id = p_category_id,
        status = p_status,
        endpoints = p_endpoints,
        config_schema = p_config_schema,
        api_schema = p_api_schema,
        updated_at = NOW()
    RETURNING *;
END;
$$;
