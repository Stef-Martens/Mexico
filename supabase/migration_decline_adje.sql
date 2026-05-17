-- Allow "declined" status on ad_fundums
-- Run in Supabase SQL Editor

ALTER TABLE ad_fundums
  DROP CONSTRAINT IF EXISTS ad_fundums_status_check;

ALTER TABLE ad_fundums
  ADD CONSTRAINT ad_fundums_status_check
  CHECK (status IN ('pending', 'completed', 'declined'));

ALTER TABLE ad_fundums
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;
