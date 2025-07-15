-- This migration simplifies the storage policy for the 'avatars' bucket
-- to allow any authenticated user to upload, which is suitable for this custom auth setup.

-- Drop the old, more restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Create a new, simpler policy for uploads (inserts)
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Create a new, simpler policy for updates
CREATE POLICY "Allow authenticated updates to avatars"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );
