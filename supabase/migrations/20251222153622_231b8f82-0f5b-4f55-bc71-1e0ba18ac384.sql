-- Phase 1a: Extend app_role enum with partner and super_admin
-- These need to be committed separately before use
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';