-- =============================================
-- DOCUMENT ACCESS CONTROL SYSTEM
-- =============================================

-- 1. Create enum for grant types
CREATE TYPE public.access_grant_type AS ENUM ('partner', 'doctor');

-- 2. Add doctor_id to documents table (for doctor uploads)
ALTER TABLE public.documents 
ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL;

-- 3. Add partner_id to doctors table (null = independent, set = attached)
ALTER TABLE public.doctors 
ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- 4. Create document_access_grants table for time-limited access
CREATE TABLE public.document_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  granted_to_type access_grant_type NOT NULL,
  granted_to_id uuid NOT NULL,
  granted_by_user_id uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_revoked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on document_access_grants
ALTER TABLE public.document_access_grants ENABLE ROW LEVEL SECURITY;

-- 5. Create helper functions to avoid RLS recursion

-- Get doctor's partner_id (for attached doctors)
CREATE OR REPLACE FUNCTION public.get_doctor_partner_id(d_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM doctors WHERE id = d_id;
$$;

-- Check if a document was uploaded by a specific partner
CREATE OR REPLACE FUNCTION public.document_uploaded_by_partner(doc_id uuid, p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = doc_id AND partner_id = p_id
  );
$$;

-- Check if a document was uploaded by a specific doctor
CREATE OR REPLACE FUNCTION public.document_uploaded_by_doctor(doc_id uuid, d_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = doc_id AND doctor_id = d_id
  );
$$;

-- Check if user owns the document (self-uploaded or pushed to their profile)
CREATE OR REPLACE FUNCTION public.user_owns_document(doc_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents d
    JOIN profiles p ON d.profile_id = p.id
    WHERE d.id = doc_id AND p.user_id = u_id
  );
$$;

-- Check if partner has valid access grant to document
CREATE OR REPLACE FUNCTION public.partner_has_document_grant(doc_id uuid, p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM document_access_grants
    WHERE document_id = doc_id
      AND granted_to_type = 'partner'
      AND granted_to_id = p_id
      AND is_revoked = false
      AND expires_at > now()
  );
$$;

-- Check if doctor has valid access grant to document
CREATE OR REPLACE FUNCTION public.doctor_has_document_grant(doc_id uuid, d_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM document_access_grants
    WHERE document_id = doc_id
      AND granted_to_type = 'doctor'
      AND granted_to_id = d_id
      AND is_revoked = false
      AND expires_at > now()
  );
$$;

-- Check if doctor is attached to a partner
CREATE OR REPLACE FUNCTION public.doctor_is_attached(d_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM doctors WHERE id = d_id AND partner_id IS NOT NULL
  );
$$;

-- 6. DROP existing document policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Partners can view their tagged documents" ON public.documents;
DROP POLICY IF EXISTS "Partners can insert tagged documents" ON public.documents;
DROP POLICY IF EXISTS "Super admins can view all documents" ON public.documents;

-- 7. Create new comprehensive RLS policies for documents

-- USERS: Full CRUD on self-uploaded documents
CREATE POLICY "Users can manage self-uploaded documents"
ON public.documents
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- USERS: Read documents pushed to their profile (by partners/doctors)
CREATE POLICY "Users can view documents pushed to their profile"
ON public.documents
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- PARTNERS: Full CRUD on documents they uploaded
CREATE POLICY "Partners can manage their uploaded documents"
ON public.documents
FOR ALL
USING (partner_id = get_partner_id(auth.uid()))
WITH CHECK (partner_id = get_partner_id(auth.uid()));

-- PARTNERS: Read documents with valid time-limited grant
CREATE POLICY "Partners can view granted documents"
ON public.documents
FOR SELECT
USING (
  partner_has_document_grant(id, get_partner_id(auth.uid()))
);

-- DOCTORS: Full CRUD on documents they uploaded
CREATE POLICY "Doctors can manage their uploaded documents"
ON public.documents
FOR ALL
USING (doctor_id = get_doctor_id(auth.uid()))
WITH CHECK (doctor_id = get_doctor_id(auth.uid()));

-- ATTACHED DOCTORS: Read documents their parent partner uploaded
CREATE POLICY "Attached doctors can view partner documents"
ON public.documents
FOR SELECT
USING (
  partner_id = get_doctor_partner_id(get_doctor_id(auth.uid()))
  AND get_doctor_partner_id(get_doctor_id(auth.uid())) IS NOT NULL
);

-- DOCTORS: Read documents with valid time-limited grant
CREATE POLICY "Doctors can view granted documents"
ON public.documents
FOR SELECT
USING (
  doctor_has_document_grant(id, get_doctor_id(auth.uid()))
);

-- SUPER ADMINS: Full access to all documents
CREATE POLICY "Super admins have full document access"
ON public.documents
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 8. RLS policies for document_access_grants

-- Users can create grants for documents they own
CREATE POLICY "Users can create grants for their documents"
ON public.document_access_grants
FOR INSERT
WITH CHECK (
  user_owns_document(document_id, auth.uid())
  AND granted_by_user_id = auth.uid()
);

-- Users can view grants they created
CREATE POLICY "Users can view their grants"
ON public.document_access_grants
FOR SELECT
USING (granted_by_user_id = auth.uid());

-- Users can update/revoke grants they created
CREATE POLICY "Users can update their grants"
ON public.document_access_grants
FOR UPDATE
USING (granted_by_user_id = auth.uid());

-- Users can delete grants they created
CREATE POLICY "Users can delete their grants"
ON public.document_access_grants
FOR DELETE
USING (granted_by_user_id = auth.uid());

-- Partners can view grants given to them
CREATE POLICY "Partners can view grants for them"
ON public.document_access_grants
FOR SELECT
USING (
  granted_to_type = 'partner' 
  AND granted_to_id = get_partner_id(auth.uid())
);

-- Doctors can view grants given to them
CREATE POLICY "Doctors can view grants for them"
ON public.document_access_grants
FOR SELECT
USING (
  granted_to_type = 'doctor' 
  AND granted_to_id = get_doctor_id(auth.uid())
);

-- Super admins have full access to grants
CREATE POLICY "Super admins have full grant access"
ON public.document_access_grants
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- 9. Update doctor_access policies for partner-managed doctors

-- Partners can grant access for their attached doctors
CREATE POLICY "Partners can manage attached doctor access"
ON public.doctor_access
FOR ALL
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE partner_id = get_partner_id(auth.uid())
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE partner_id = get_partner_id(auth.uid())
  )
);

-- 10. Add index for performance
CREATE INDEX idx_document_access_grants_document ON public.document_access_grants(document_id);
CREATE INDEX idx_document_access_grants_granted_to ON public.document_access_grants(granted_to_type, granted_to_id);
CREATE INDEX idx_documents_doctor_id ON public.documents(doctor_id);
CREATE INDEX idx_doctors_partner_id ON public.doctors(partner_id);