-- Create admin_profiles table for super admin settings
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  support_email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view their own profile
CREATE POLICY "Super admins can view their profile"
ON public.admin_profiles FOR SELECT
USING (is_super_admin(auth.uid()) AND user_id = auth.uid());

-- Policy: Super admins can insert their own profile
CREATE POLICY "Super admins can insert their profile"
ON public.admin_profiles FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) AND user_id = auth.uid());

-- Policy: Super admins can update their own profile
CREATE POLICY "Super admins can update their profile"
ON public.admin_profiles FOR UPDATE
USING (is_super_admin(auth.uid()) AND user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();