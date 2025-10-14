
-- This migration creates a debug table and trigger to inspect the audit context.

-- Step 1: Create a table to store debug information.
CREATE TABLE IF NOT EXISTS public.debug_audit (
    id serial PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    auth_uid text,
    jwt_claims text
);

-- Step 2: Create a function to capture the audit context.
CREATE OR REPLACE FUNCTION public.debug_audit_context()
RETURNS TRIGGER AS $$
DECLARE
    v_auth_uid text;
    v_jwt_claims text;
BEGIN
    -- Capture auth.uid()
    BEGIN
        v_auth_uid := auth.uid()::text;
    EXCEPTION WHEN OTHERS THEN
        v_auth_uid := 'Error capturing auth.uid(): ' || SQLERRM;
    END;

    -- Capture JWT claims
    BEGIN
        v_jwt_claims := current_setting('request.jwt.claims', true);
    EXCEPTION WHEN OTHERS THEN
        v_jwt_claims := 'Error capturing jwt.claims: ' || SQLERRM;
    END;

    -- Insert the captured values into the debug table.
    INSERT INTO public.debug_audit (auth_uid, jwt_claims)
    VALUES (v_auth_uid, v_jwt_claims);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a trigger on the tenants table to call the debug function.
CREATE TRIGGER debug_audit_trigger
AFTER INSERT ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.debug_audit_context();
