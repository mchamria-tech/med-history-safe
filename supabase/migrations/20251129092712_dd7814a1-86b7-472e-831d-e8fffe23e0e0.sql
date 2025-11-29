-- Make storage buckets private for better security
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('profile-photos', 'profile-documents');

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create RLS policies for profile-photos bucket
CREATE POLICY "Users can view their own profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for profile-documents bucket
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);