-- Migration: Add missing analysis columns to patient_records
-- Run this in your Supabase SQL Editor to fix the "Column not found" errors.

ALTER TABLE patient_records 
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT,
ADD COLUMN IF NOT EXISTS risk_score FLOAT,
ADD COLUMN IF NOT EXISTS bmi FLOAT,
ADD COLUMN IF NOT EXISTS pattern_arc INTEGER,
ADD COLUMN IF NOT EXISTS pattern_whorl INTEGER,
ADD COLUMN IF NOT EXISTS pattern_loop INTEGER,
ADD COLUMN IF NOT EXISTS willing_to_donate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gender TEXT; -- Correctly adding gender now

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload schema';
