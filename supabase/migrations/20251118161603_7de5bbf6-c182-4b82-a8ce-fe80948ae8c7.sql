-- Add search fields to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS ailment TEXT,
ADD COLUMN IF NOT EXISTS medicine TEXT,
ADD COLUMN IF NOT EXISTS other_tags TEXT;