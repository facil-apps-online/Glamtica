-- supabase/migrations/20250712003000_create_get_user_claims_from_jwt_function.sql

CREATE OR REPLACE FUNCTION public.get_user_claims_from_jwt(
    jwt_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    claims JSONB;
BEGIN
    claims := auth.jwt_verify(jwt_token);
    RETURN claims;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.get_user_claims_from_jwt(TEXT) TO public;
