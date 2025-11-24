-- Add admin response fields to feedback table
ALTER TABLE public.feedback
ADD COLUMN admin_response text,
ADD COLUMN admin_responded_at timestamp with time zone,
ADD COLUMN admin_responder_id uuid;