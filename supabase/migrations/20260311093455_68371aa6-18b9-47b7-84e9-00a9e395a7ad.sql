CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_global_id text;
BEGIN
  -- Generate a permanent Global ID for this user account at registration
  new_global_id := generate_global_id('user', 'IND');
  
  INSERT INTO public.profiles (user_id, email, name, relation, carebag_id, country)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown'),
    'Self',
    new_global_id,
    'IND'
  );
  RETURN new;
END;
$$;