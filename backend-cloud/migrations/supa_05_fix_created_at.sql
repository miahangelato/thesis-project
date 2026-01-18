-- Migration: Fix created_at column to auto-set timestamp
-- Run this in your Supabase SQL Editor to fix the "null value in column created_at" error.

ALTER TABLE patient_records 
ALTER COLUMN created_at SET DEFAULT now();

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
