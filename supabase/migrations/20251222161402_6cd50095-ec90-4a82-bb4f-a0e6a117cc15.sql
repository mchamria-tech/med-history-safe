-- Add new columns to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS gst_number text,
ADD COLUMN IF NOT EXISTS govt_certification text;

-- Create storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to partner logos
CREATE POLICY "Partner logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-logos');

-- Allow super admins to upload partner logos
CREATE POLICY "Super admins can upload partner logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'partner-logos' AND is_super_admin(auth.uid()));

-- Allow super admins to update partner logos
CREATE POLICY "Super admins can update partner logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'partner-logos' AND is_super_admin(auth.uid()));

-- Allow super admins to delete partner logos
CREATE POLICY "Super admins can delete partner logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'partner-logos' AND is_super_admin(auth.uid()));