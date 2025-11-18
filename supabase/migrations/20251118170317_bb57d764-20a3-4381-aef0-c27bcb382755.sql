-- Make profile-documents bucket public for easier document viewing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-documents';