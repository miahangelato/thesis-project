-- Migration: Fix ID column to auto-generate UUIDs
-- Run this in your Supabase SQL Editor to fix the "null value in column id" error.

ALTER TABLE patient_records 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
