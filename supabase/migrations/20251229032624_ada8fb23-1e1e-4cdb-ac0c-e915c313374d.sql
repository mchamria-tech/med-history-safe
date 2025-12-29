-- Create a function to check OTP rate limit (3 per profile per hour)
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count OTP requests for this partner/profile combo in the last hour
  SELECT COUNT(*) INTO recent_count
  FROM public.partner_otp_requests
  WHERE partner_id = NEW.partner_id
    AND profile_id = NEW.profile_id
    AND created_at > NOW() - INTERVAL '1 hour';

  -- Enforce rate limit of 3 per hour
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 3 OTP requests per hour per user.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce rate limiting on INSERT
CREATE TRIGGER enforce_otp_rate_limit
  BEFORE INSERT ON public.partner_otp_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_otp_rate_limit();