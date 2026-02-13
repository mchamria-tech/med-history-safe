
-- Add country column to partners
ALTER TABLE public.partners 
  ADD COLUMN country text NOT NULL DEFAULT 'IND';

-- Update generate_global_id to accept country_code
CREATE OR REPLACE FUNCTION public.generate_global_id(
  role_type text DEFAULT 'user',
  country_code text DEFAULT 'IND'
)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  prefix char;
  new_id text;
  exists_check boolean;
BEGIN
  prefix := CASE role_type
    WHEN 'user' THEN 'A'
    WHEN 'admin' THEN '0'
    WHEN 'doctor' THEN 'D'
    WHEN 'partner' THEN 'X'
    ELSE 'A'
  END;

  LOOP
    new_id := upper(country_code) || '-' || prefix 
              || upper(substr(md5(random()::text), 1, 5));
    IF role_type IN ('user', 'admin') THEN
      SELECT EXISTS(SELECT 1 FROM profiles WHERE carebag_id = new_id) INTO exists_check;
    ELSIF role_type = 'doctor' THEN
      SELECT EXISTS(SELECT 1 FROM doctors WHERE global_id = new_id) INTO exists_check;
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
