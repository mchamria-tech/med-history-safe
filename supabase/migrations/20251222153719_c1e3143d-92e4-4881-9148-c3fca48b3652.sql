-- Phase 1c: RLS Policies for new tables

-- Partners table policies
CREATE POLICY "Partners can view their own record"
ON partners FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all partners"
ON partners FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert partners"
ON partners FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update partners"
ON partners FOR UPDATE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete partners"
ON partners FOR DELETE
USING (is_super_admin(auth.uid()));

-- Partner users table policies
CREATE POLICY "Partners can view their linked users"
ON partner_users FOR SELECT
USING (partner_id = get_partner_id(auth.uid()));

CREATE POLICY "Partners can link users"
ON partner_users FOR INSERT
WITH CHECK (partner_id = get_partner_id(auth.uid()));

CREATE POLICY "Partners can update their links"
ON partner_users FOR UPDATE
USING (partner_id = get_partner_id(auth.uid()));

CREATE POLICY "Partners can delete their links"
ON partner_users FOR DELETE
USING (partner_id = get_partner_id(auth.uid()));

CREATE POLICY "Super admins can view all partner_users"
ON partner_users FOR SELECT
USING (is_super_admin(auth.uid()));

-- Partner OTP requests policies
CREATE POLICY "Partners can manage their OTP requests"
ON partner_otp_requests FOR ALL
USING (partner_id = get_partner_id(auth.uid()));

-- Admin audit logs policies
CREATE POLICY "Super admins can view audit logs"
ON admin_audit_logs FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create audit logs"
ON admin_audit_logs FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Update profiles RLS: Partners can view profiles they're linked to
CREATE POLICY "Partners can view linked profiles"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT profile_id FROM partner_users 
    WHERE partner_id = get_partner_id(auth.uid())
  )
);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
USING (is_super_admin(auth.uid()));

-- Update documents RLS: Partners can view/insert their own tagged documents
CREATE POLICY "Partners can view their tagged documents"
ON documents FOR SELECT
USING (partner_id = get_partner_id(auth.uid()));

CREATE POLICY "Partners can insert tagged documents"
ON documents FOR INSERT
WITH CHECK (partner_id = get_partner_id(auth.uid()));

-- Super admins can view all documents
CREATE POLICY "Super admins can view all documents"
ON documents FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can view all user_roles
CREATE POLICY "Super admins can view all user_roles"
ON user_roles FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can insert user_roles
CREATE POLICY "Super admins can insert user_roles"
ON user_roles FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Super admins can delete user_roles
CREATE POLICY "Super admins can delete user_roles"
ON user_roles FOR DELETE
USING (is_super_admin(auth.uid()));