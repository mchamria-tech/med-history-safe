-- Add storage policies for partners to upload documents to linked profiles
CREATE POLICY "Partners can upload documents to linked profiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-documents' 
  AND EXISTS (
    SELECT 1 FROM public.partner_users pu
    JOIN public.profiles p ON pu.profile_id = p.id
    WHERE pu.partner_id = public.get_partner_id(auth.uid())
    AND p.user_id::text = (storage.foldername(name))[1]
    AND pu.consent_given = true
  )
);

-- Add policy for partners to view documents they uploaded
CREATE POLICY "Partners can view documents they uploaded"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.document_url LIKE '%' || name
    AND d.partner_id = public.get_partner_id(auth.uid())
  )
);