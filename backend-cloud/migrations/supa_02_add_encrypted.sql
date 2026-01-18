-- Migration: Add encrypted_data column for Phase 2 Security
-- Run this in your Supabase SQL Editor

ALTER TABLE patient_records 
ADD COLUMN IF NOT EXISTS encrypted_data JSONB;

-- Optional: If you want to allow NULLs for PII columns in the future
-- ALTER TABLE patient_records ALTER COLUMN age DROP NOT NULL;
-- ALTER TABLE patient_records ALTER COLUMN weight_kg DROP NOT NULL;
-- ALTER TABLE patient_records ALTER COLUMN height_cm DROP NOT NULL;
