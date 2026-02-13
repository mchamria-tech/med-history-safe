
-- Fix 1: Tighten partner profile access to require active consent
DROP POLICY IF EXISTS "Partners can view linked or created profiles" ON public.profiles;

CREATE POLICY "Partners can view linked or created profiles"
ON public.profiles
FOR SELECT
USING (
  (created_by_partner_id IN (
    SELECT partners.id FROM partners WHERE partners.user_id = auth.uid()
  ))
  OR
  (id IN (
    SELECT pu.profile_id FROM partner_users pu
    WHERE pu.partner_id = get_partner_id(auth.uid())
      AND pu.consent_given = true
  ))
);

-- Fix 2: Remove overly broad "Attached doctors can view partner documents" policy
-- Doctors should only access documents via explicit document_access_grants or doctor_access
DROP POLICY IF EXISTS "Attached doctors can view partner documents" ON public.documents;

-- Fix 3: Revoke anon access to get_email_by_global_id
REVOKE EXECUTE ON FUNCTION public.get_email_by_global_id(text) FROM anon;
