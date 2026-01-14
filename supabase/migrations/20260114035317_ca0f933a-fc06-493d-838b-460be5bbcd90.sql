-- Phase 1a: Add 'doctor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';