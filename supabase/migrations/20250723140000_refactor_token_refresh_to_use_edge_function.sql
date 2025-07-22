-- Refactorizar la función de refresco de tokens para usar la Edge Function de descifrado.

CREATE OR REPLACE FUNCTION private.refresh_and_get_gmail_token()
RETURNS TEXT -- Devuelve un access_token fresco
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
    v_integration RECORD;
    v_access_token TEXT;
    v_refresh_token TEXT;
    v_decrypted_response JSONB;
    v_refresh_response JSONB;
    v_supabase_url TEXT;
    v_service_role_key TEXT;
    v_decrypt_function_url TEXT;
    v_refresh_function_url TEXT;
BEGIN
    -- Obtener la integración de Gmail del superadmin
    SELECT * INTO v_integration
    FROM public.tenant_integrations
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND provider = 'google_gmail'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la integración de google_gmail para el superadmin.';
    END IF;

    v_access_token := v_integration.access_token;

    -- Lógica de Refresco de Token si es necesario
    IF v_integration.expires_at IS NULL OR v_integration.expires_at < now() THEN
        -- Obtener secretos necesarios
        SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url';
        SELECT decrypted_secret INTO v_service_role_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
        
        v_decrypt_function_url := v_supabase_url || '/functions/v1/decrypt-secret';
        v_refresh_function_url := v_supabase_url || '/functions/v1/refresh-google-token';

        -- 1. Descifrar el refresh token llamando a la Edge Function segura
        SELECT content INTO v_decrypted_response FROM net.http_post(
            url:= v_decrypt_function_url,
            body:= jsonb_build_object(
                'encryptedData', v_integration.encrypted_credentials,
                'iv', v_integration.nonce
            ),
            headers:= jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            )
        );

        IF v_decrypted_response->>'decryptedText' IS NULL THEN
            RAISE EXCEPTION 'Error al descifrar el token desde Edge Function: %', (v_decrypted_response->>'error');
        END IF;
        v_refresh_token := v_decrypted_response->>'decryptedText';

        -- 2. Invocar la Edge Function para obtener un nuevo token de acceso
        SELECT content INTO v_refresh_response FROM net.http_post(
            url:= v_refresh_function_url,
            body:= jsonb_build_object('refreshToken', v_refresh_token),
            headers:= jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            )
        );
        
        IF v_refresh_response->>'access_token' IS NULL THEN
            RAISE EXCEPTION 'Error al refrescar token desde Edge Function: %', (v_refresh_response->>'error');
        END IF;

        v_access_token := v_refresh_response->>'access_token';

        -- 3. Actualizar la tabla con el nuevo token y la nueva fecha de expiración
        UPDATE public.tenant_integrations
        SET
            access_token = v_access_token,
            expires_at = now() + ((v_refresh_response->>'expires_in')::INT * interval '1 second')
        WHERE id = v_integration.id;
    END IF;

    RETURN v_access_token;
END;
$$;
