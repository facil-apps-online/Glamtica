-- Drop the old login function
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT);

-- Recreate the login function to handle JWT generation directly
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    jwt_token TEXT;
    jwt_secret TEXT;
BEGIN
    -- Find the user by email
    SELECT
        u.id, u.password_hash, u.tenant_id, u.branch_id, r.name AS role_name
    INTO
        user_record
    FROM
        public.users u
    JOIN
        public.roles r ON u.role_id = r.id
    WHERE
        u.email = p_email AND u.is_active = TRUE;

    -- Check if user exists and password is correct
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    -- Get the JWT secret from environment variables
    -- Note: This requires setting the JWT_SECRET in Supabase Dashboard > Settings > Configuration > Secrets
    SELECT decrypted_secret INTO jwt_secret FROM vault.decrypted_secrets WHERE name = 'VITE_SUPABASE_JWT_SECRET';
    IF jwt_secret IS NULL THEN
        RAISE EXCEPTION 'JWT secret not configured in Vault.';
    END IF;

    -- Generate the JWT token
    jwt_token := public.sign(
        json_build_object(
            'sub', user_record.id,
            'email', p_email,
            'role', user_record.role_name,
            'tenant_id', user_record.tenant_id,
            'branch_id', user_record.branch_id,
            'exp', extract(epoch from now() + interval '1 day')
        ),
        jwt_secret
    );

    -- Return success with the token
    RETURN json_build_object(
        'success', TRUE,
        'token', jwt_token
    );
END;
$$ LANGUAGE plpgsql;
