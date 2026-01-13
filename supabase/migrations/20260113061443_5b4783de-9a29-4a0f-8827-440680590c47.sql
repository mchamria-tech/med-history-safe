-- Add created_by_partner_id column to track which partner created the profile
ALTER TABLE public.profiles ADD COLUMN created_by_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- Allow user_id to be nullable for partner-created profiles
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Create index for faster lookups on created_by_partner_id
CREATE INDEX idx_profiles_created_by_partner_id ON public.profiles(created_by_partner_id);

-- Drop existing profile policies that need updating
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Partners can view linked profiles" ON public.profiles;

-- Recreate user policies with null-safe checks
CREATE POLICY "Users can view their own profiles"
ON public.profiles FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
ON public.profiles FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
ON public.profiles FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
ON public.profiles FOR DELETE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Partners can view profiles they created OR profiles linked to them
CREATE POLICY "Partners can view linked or created profiles"
ON public.profiles FOR SELECT
USING (
  created_by_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  OR id IN (SELECT profile_id FROM public.partner_users WHERE partner_id = get_partner_id(auth.uid()))
);

-- Partners can create profiles (with created_by_partner_id set to their partner record)
CREATE POLICY "Partners can create profiles"
ON public.profiles FOR INSERT
WITH CHECK (
  created_by_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
);

-- Partners can update profiles they created (until claimed by a user)
CREATE POLICY "Partners can update created profiles"
ON public.profiles FOR UPDATE
USING (
  user_id IS NULL 
  AND created_by_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
);