-- This migration creates a function to generate a signed URL for uploading avatars.

CREATE OR REPLACE FUNCTION public.create_signed_avatar_upload_url(
    p_file_path TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signed_url TEXT;
BEGIN
    -- Generate a signed URL that is valid for 5 minutes.
    -- The URL allows uploading a file with the specified path.
    SELECT storage.sign_upload_url('avatars', p_file_path, 300) INTO signed_url;

    RETURN json_build_object('success', TRUE, 'signedUrl', signed_url);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create signed upload URL: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_signed_avatar_upload_url(TEXT) TO public;
