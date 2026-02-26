
-- Partners can update their own record
CREATE POLICY "Partners can update their own record"
ON public.partners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Partners can view their attached doctors
CREATE POLICY "Partners can view attached doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (partner_id = get_partner_id(auth.uid()));

-- Partners can update their attached doctors
CREATE POLICY "Partners can update attached doctors"
ON public.doctors
FOR UPDATE
TO authenticated
USING (partner_id = get_partner_id(auth.uid()));
