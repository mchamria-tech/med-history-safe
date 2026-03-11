
-- Create doctor_patients table for persistent care team relationships
CREATE TABLE public.doctor_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by_user_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;

-- Doctors can view their own patient records
CREATE POLICY "Doctors can view their patients"
ON public.doctor_patients
FOR SELECT
TO authenticated
USING (doctor_id = get_doctor_id(auth.uid()));

-- Users can grant access (insert)
CREATE POLICY "Users can grant doctor patient access"
ON public.doctor_patients
FOR INSERT
TO authenticated
WITH CHECK (granted_by_user_id = auth.uid());

-- Users can revoke access (update is_active)
CREATE POLICY "Users can revoke doctor patient access"
ON public.doctor_patients
FOR UPDATE
TO authenticated
USING (granted_by_user_id = auth.uid());

-- Super admins full access
CREATE POLICY "Super admins can view all doctor_patients"
ON public.doctor_patients
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
