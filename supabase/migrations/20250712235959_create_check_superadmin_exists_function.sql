CREATE OR REPLACE FUNCTION public.check_superadmin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    superadmin_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE r.name = 'superadmin'
    ) INTO superadmin_exists;

    RETURN superadmin_exists;
END;
$$;