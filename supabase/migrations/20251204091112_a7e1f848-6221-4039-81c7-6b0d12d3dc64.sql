-- Remove the overly permissive policy that allows all users to view all profile photos
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;