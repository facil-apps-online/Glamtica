-- This function securely constructs the Google OAuth consent screen URL,
-- including the tenant_id in the state parameter for tracking.

DROP FUNCTION IF EXISTS public.get_google_auth_url();
CREATE OR REPLACE FUNCTION public.get_google_auth_url(p_tenant_id UUID)
RETURNS JSON AS $$
DECLARE
    client_id TEXT;
    redirect_uri TEXT;
    scope TEXT;
    auth_url TEXT;
BEGIN
    -- 1. Get the Client ID from the Vault
    SELECT decrypted_secret INTO client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID';
    IF client_id IS NULL THEN
        RAISE EXCEPTION 'GOOGLE_CLIENT_ID not configured in Vault.';
    END IF;

    -- 2. Define the Redirect URI and Scopes
    redirect_uri := 'http://localhost:5173/integrations/google/callback';
    scope := 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';

    -- 3. Construct the full authorization URL, now with the state parameter
    auth_url := 'https://accounts.google.com/o/oauth2/v2/auth?' ||
                'client_id=' || client_id ||
                '&redirect_uri=' || redirect_uri ||
                '&scope=' || scope ||
                '&response_type=code' ||
                '&access_type=offline' ||
                '&prompt=consent' ||
                '&state=' || p_tenant_id::text; -- Include tenant_id in the state

    -- 4. Return the URL as JSON
    RETURN json_build_object('success', TRUE, 'url', auth_url);

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to construct Google Auth URL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_google_auth_url(UUID) TO public;
