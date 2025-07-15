-- This function checks if the user associated with the current session is still active.
CREATE OR REPLACE FUNCTION public.get_session_status()
RETURNS JSON AS $$
DECLARE
    user_is_active BOOLEAN;
    current_user_id_text TEXT;
BEGIN
    -- Get the user ID from the session variable set on login.
    current_user_id_text := current_setting('app.current_user_id', TRUE);

    -- If there's no user ID in the session, they are not active.
    IF current_user_id_text IS NULL OR current_user_id_text = '' THEN
        RETURN json_build_object('is_active', false);
    END IF;

    -- Check the is_active flag for that user in the public.users table.
    SELECT
        u.is_active
    INTO
        user_is_active
    FROM
        public.users u
    WHERE
        u.id = current_user_id_text::uuid;

    -- Return the user's active status.
    RETURN json_build_object('is_active', COALESCE(user_is_active, false));
END;
$$ LANGUAGE plpgsql;