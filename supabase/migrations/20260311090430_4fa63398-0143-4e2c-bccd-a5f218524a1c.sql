
-- Allow doctors to view profiles they have persistent access to
CREATE POLICY "Doctors can view care team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT dp.profile_id FROM public.doctor_patients dp
    WHERE dp.doctor_id = get_doctor_id(auth.uid())
      AND dp.is_active = true
  )
);

-- Allow doctors to view profiles they have active time-limited access to
CREATE POLICY "Doctors can view active access profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT da.profile_id FROM public.doctor_access da
    WHERE da.doctor_id = get_doctor_id(auth.uid())
      AND da.is_revoked = false
      AND da.expires_at > now()
  )
);
