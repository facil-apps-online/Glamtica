
DO $$
BEGIN
    PERFORM public.set_session_context('test_token', 'test_secret');
    RAISE NOTICE 'Function set_session_context(TEXT, TEXT) exists and is callable.';
EXCEPTION
    WHEN undefined_function THEN
        RAISE EXCEPTION 'Function set_session_context(TEXT, TEXT) does not exist.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error calling set_session_context(TEXT, TEXT): %', SQLERRM;
END
$$;
