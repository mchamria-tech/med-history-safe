-- Create the generate_global_id function with role-based prefixes
CREATE OR REPLACE FUNCTION public.generate_global_id(role_type text DEFAULT 'user')
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  prefix char;
  new_id text;
  exists_check boolean;
BEGIN
  -- Determine prefix based on role
  prefix := CASE role_type
    WHEN 'user' THEN 'A'
    WHEN 'admin' THEN '0'
    WHEN 'doctor' THEN 'D'
    WHEN 'partner' THEN 'X'
    ELSE 'A'
  END;
  
  LOOP
    new_id := 'IND-' || prefix || upper(substr(md5(random()::text), 1, 5));
    -- Check against profiles table for user/admin IDs
    IF role_type IN ('user', 'admin') THEN
      SELECT EXISTS(SELECT 1 FROM profiles WHERE carebag_id = new_id) INTO exists_check;
    -- Check against doctors table for doctor IDs
    ELSIF role_type = 'doctor' THEN
      SELECT EXISTS(SELECT 1 FROM doctors WHERE global_id = new_id) INTO exists_check;
    -- Check against partners table for partner IDs
    ELSIF role_type = 'partner' THEN
      SELECT EXISTS(SELECT 1 FROM partners WHERE partner_code = new_id) INTO exists_check;
    ELSE
      exists_check := false;
    END IF;
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Create doctors table
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  global_id text UNIQUE NOT NULL,
  name text NOT NULL,
  specialty text,
  hospital text,
  email text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create doctor_access table for time-limited access
CREATE TABLE public.doctor_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  granted_by_user_id uuid,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_revoked boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_access ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is a doctor
CREATE OR REPLACE FUNCTION public.is_doctor(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_roles.user_id = $1 AND role = 'doctor'
  );
$$;

-- Create helper function to get doctor_id from user_id
CREATE OR REPLACE FUNCTION public.get_doctor_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM doctors WHERE doctors.user_id = $1;
$$;

-- RLS Policies for doctors table
CREATE POLICY "Doctors can view their own record"
ON public.doctors FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all doctors"
ON public.doctors FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert doctors"
ON public.doctors FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update doctors"
ON public.doctors FOR UPDATE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete doctors"
ON public.doctors FOR DELETE
USING (is_super_admin(auth.uid()));

-- RLS Policies for doctor_access table
CREATE POLICY "Doctors can view their granted access"
ON public.doctor_access FOR SELECT
USING (doctor_id = get_doctor_id(auth.uid()));

CREATE POLICY "Users can view access they granted"
ON public.doctor_access FOR SELECT
USING (granted_by_user_id = auth.uid());

CREATE POLICY "Users can grant doctor access"
ON public.doctor_access FOR INSERT
WITH CHECK (granted_by_user_id = auth.uid());

CREATE POLICY "Users can revoke access they granted"
ON public.doctor_access FOR UPDATE
USING (granted_by_user_id = auth.uid());

CREATE POLICY "Super admins can view all doctor_access"
ON public.doctor_access FOR SELECT
USING (is_super_admin(auth.uid()));

-- Add trigger for updated_at on doctors
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();