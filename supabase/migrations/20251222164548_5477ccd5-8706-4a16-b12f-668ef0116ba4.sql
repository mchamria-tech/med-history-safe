-- Add ticket_code column to feedback table
ALTER TABLE public.feedback ADD COLUMN ticket_code text;

-- Create a unique index on ticket_code
CREATE UNIQUE INDEX idx_feedback_ticket_code ON public.feedback(ticket_code);

-- Create function to generate ticket code (4 digits + 1 letter, e.g., 0001C)
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  next_num integer;
  letter char;
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(SUBSTRING(ticket_code FROM 1 FOR 4)::integer), 0) + 1 
  INTO next_num 
  FROM feedback 
  WHERE ticket_code IS NOT NULL;
  
  -- Generate a random letter A-Z
  letter := chr(65 + floor(random() * 26)::integer);
  
  -- Format as 4-digit number + letter
  new_code := lpad(next_num::text, 4, '0') || letter;
  
  RETURN new_code;
END;
$$;

-- Create trigger to auto-generate ticket_code on insert
CREATE OR REPLACE FUNCTION public.set_ticket_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_code IS NULL THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_ticket_code
BEFORE INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.set_ticket_code();

-- Update existing feedback entries with ticket codes
DO $$
DECLARE
  fb RECORD;
  counter integer := 0;
  letter char;
BEGIN
  FOR fb IN SELECT id FROM public.feedback WHERE ticket_code IS NULL ORDER BY created_at ASC
  LOOP
    counter := counter + 1;
    letter := chr(65 + floor(random() * 26)::integer);
    UPDATE public.feedback 
    SET ticket_code = lpad(counter::text, 4, '0') || letter
    WHERE id = fb.id;
  END LOOP;
END;
$$;

-- Add RLS policy for super_admin to delete feedback
CREATE POLICY "Super admins can delete feedback" 
ON public.feedback 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Also add super_admin SELECT and UPDATE policies
CREATE POLICY "Super admins can view all feedback" 
ON public.feedback 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all feedback" 
ON public.feedback 
FOR UPDATE 
USING (is_super_admin(auth.uid()));