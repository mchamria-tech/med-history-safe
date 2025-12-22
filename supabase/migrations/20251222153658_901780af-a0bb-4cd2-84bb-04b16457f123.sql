-- Phase 1b: Database Schema for B2B Partner Portal and Super-Admin

-- 1.2 Add carebag_id to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS carebag_id text UNIQUE;

-- 1.3 Create function to generate unique CareBag ID (starts with '1')
CREATE OR REPLACE FUNCTION generate_carebag_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id text;
  exists_check boolean;
BEGIN
  LOOP
    new_id := '1' || upper(substr(md5(random()::text), 1, 5));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE carebag_id = new_id) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_id;
END;
$$;

-- 1.4 Create function to generate unique Partner Code (starts with 'X')
CREATE OR REPLACE FUNCTION generate_partner_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  exists_check boolean;
BEGIN
  LOOP
    new_code := 'X' || upper(substr(md5(random()::text), 1, 5));
    SELECT EXISTS(SELECT 1 FROM partners WHERE partner_code = new_code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_code;
END;
$$;

-- 1.5 Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_code text UNIQUE NOT NULL,
  name text NOT NULL,
  logo_url text,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 1.6 Create partner_users linking table (links partners to user profiles)
CREATE TABLE IF NOT EXISTS partner_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consent_given boolean DEFAULT false,
  consent_timestamp timestamptz,
  linked_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, profile_id)
);

-- Enable RLS on partner_users
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;

-- 1.7 Add partner columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS partner_source_name text;

-- 1.8 Create partner_otp_requests table for OTP verification flow
CREATE TABLE IF NOT EXISTS partner_otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on partner_otp_requests
ALTER TABLE partner_otp_requests ENABLE ROW LEVEL SECURITY;

-- 1.9 Create admin_audit_logs table for super-admin audit trail
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_audit_logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1.10 Helper function: Get partner ID for authenticated partner user
CREATE OR REPLACE FUNCTION get_partner_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM partners WHERE partners.user_id = $1;
$$;

-- 1.11 Helper function: Check if user is a partner
CREATE OR REPLACE FUNCTION is_partner(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_roles.user_id = $1 AND role = 'partner'
  );
$$;

-- 1.12 Helper function: Check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_roles.user_id = $1 AND role = 'super_admin'
  );
$$;

-- 1.13 Update trigger for partners table
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();