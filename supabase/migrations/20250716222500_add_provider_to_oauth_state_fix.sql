-- supabase/migrations/20250716221500_add_provider_to_oauth_state.sql

-- Primero, eliminamos las funciones existentes para evitar conflictos de firma.
DROP FUNCTION IF EXISTS get_google_auth_url(uuid);
DROP FUNCTION IF EXISTS get_gmail_auth_url(uuid);

-- Creamos una tabla de configuración de integraciones si no existe
CREATE TABLE IF NOT EXISTS public.integrations_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insertamos los valores de configuración si no existen.
-- ¡IMPORTANTE! Estos valores son placeholders y deben ser gestionados por ti.
-- El sistema los necesita para funcionar, pero no se deben commitear valores reales.
INSERT INTO public.integrations_config (key, value) VALUES
    ('google_oauth_client_id', 'TU_CLIENT_ID_AQUI'),
    ('google_oauth_redirect_uri', 'TU_REDIRECT_URI_AQUI')
ON CONFLICT (key) DO NOTHING;


-- Redefine get_google_auth_url
CREATE OR REPLACE FUNCTION get_google_auth_url(p_tenant_id uuid)
RETURNS TABLE(success boolean, url text, message text) AS $$
DECLARE
    v_client_id TEXT;
    v_redirect_uri TEXT;
    v_state TEXT;
    v_scope TEXT;
    v_auth_url TEXT;
BEGIN
    -- 1. Obtener configuración de la tabla public.integrations_config
    SELECT value INTO v_client_id FROM public.integrations_config WHERE key = 'google_oauth_client_id';
    SELECT value INTO v_redirect_uri FROM public.integrations_config WHERE key = 'google_oauth_redirect_uri';

    IF v_client_id IS NULL OR v_redirect_uri IS NULL OR v_client_id = 'TU_CLIENT_ID_AQUI' THEN
        RETURN QUERY SELECT false, null, 'Client ID o Redirect URI de Google no configurados en integrations_config.';
        RETURN;
    END IF;

    -- 2. Construir el 'state'
    v_state := p_tenant_id::text || ':google_drive';

    -- 3. Definir el scope
    v_scope := 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

    -- 4. Construir la URL
    v_auth_url := 'https://accounts.google.com/o/oauth2/v2/auth?' ||
                  'client_id=' || url_encode(v_client_id) ||
                  '&redirect_uri=' || url_encode(v_redirect_uri) ||
                  '&response_type=code' ||
                  '&scope=' || url_encode(v_scope) ||
                  '&access_type=offline' ||
                  '&prompt=consent' ||
                  '&state=' || url_encode(v_state);

    RETURN QUERY SELECT true, v_auth_url, 'URL de autorización para Google Drive generada.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redefine get_gmail_auth_url
CREATE OR REPLACE FUNCTION get_gmail_auth_url(p_tenant_id uuid)
RETURNS TABLE(success boolean, url text, message text) AS $$
DECLARE
    v_client_id TEXT;
    v_redirect_uri TEXT;
    v_state TEXT;
    v_scope TEXT;
    v_auth_url TEXT;
BEGIN
    -- 1. Obtener configuración de la tabla public.integrations_config
    SELECT value INTO v_client_id FROM public.integrations_config WHERE key = 'google_oauth_client_id';
    SELECT value INTO v_redirect_uri FROM public.integrations_config WHERE key = 'google_oauth_redirect_uri';

    IF v_client_id IS NULL OR v_redirect_uri IS NULL OR v_client_id = 'TU_CLIENT_ID_AQUI' THEN
        RETURN QUERY SELECT false, null, 'Client ID o Redirect URI de Google no configurados en integrations_config.';
        RETURN;
    END IF;

    -- 2. Construir el 'state'
    v_state := p_tenant_id::text || ':google_gmail';

    -- 3. Definir el scope
    v_scope := 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

    -- 4. Construir la URL
    v_auth_url := 'https://accounts.google.com/o/oauth2/v2/auth?' ||
                  'client_id=' || url_encode(v_client_id) ||
                  '&redirect_uri=' || url_encode(v_redirect_uri) ||
                  '&response_type=code' ||
                  '&scope=' || url_encode(v_scope) ||
                  '&access_type=offline' ||
                  '&prompt=consent' ||
                  '&state=' || url_encode(v_state);

    RETURN QUERY SELECT true, v_auth_url, 'URL de autorización para Gmail generada.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
