-- Create a SECURITY DEFINER function that allows Global ID lookup for authentication
-- This bypasses RLS to enable login with custom identifiers
CREATE OR REPLACE FUNCTION public.get_email_by_global_id(global_id TEXT)
RETURNS TABLE (email TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.user_id
  FROM profiles p
  WHERE p.carebag_id = global_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon (unauthenticated) users for login flow
GRANT EXECUTE ON FUNCTION public.get_email_by_global_id(TEXT) TO anon;