-- Create a public bucket for avatars if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the avatars bucket.
-- 1. Allow public read access to all avatars.
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload their own avatar.
-- The user's ID must match the first part of the file path (e.g., "user-id/avatar.png").
CREATE POLICY "Authenticated users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 3. Allow users to update their own avatar.
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );
