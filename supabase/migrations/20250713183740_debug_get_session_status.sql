-- This migration adds debugging notices to the get_session_status function.

CREATE OR REPLACE FUNCTION public.get_session_status()
RETURNS JSON AS $$
DECLARE
    user_is_active BOOLEAN;
    current_user_id_text TEXT;
BEGIN
    -- Log 1: Start of the function
    RAISE NOTICE '[get_session_status] Function started.';

    -- Get the user ID from the session variable
    current_user_id_text := current_setting('app.current_user_id', TRUE);
    RAISE NOTICE '[get_session_status] current_user_id_text from session: %', current_user_id_text;

    IF current_user_id_text IS NULL OR current_user_id_text = '' THEN
        RAISE NOTICE '[get_session_status] User ID is null or empty. Returning inactive.';
        RETURN json_build_object('is_active', false);
    END IF;

    -- Check the is_active flag for that user
    SELECT
        u.is_active
    INTO
        user_is_active
    FROM
        public.users u
    WHERE
        u.id = current_user_id_text::uuid;
    
    RAISE NOTICE '[get_session_status] Found user with is_active = %', user_is_active;

    -- Return the user's active status
    RETURN json_build_object('is_active', COALESCE(user_is_active, false));
END;
$$ LANGUAGE plpgsql;
