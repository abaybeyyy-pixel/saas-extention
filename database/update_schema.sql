-- Add new columns for Registration & Approval System
-- Run this in Supabase SQL Editor

ALTER TABLE licenses 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED'));

-- Allow 'PENDING' licenses to have NULL license_key initially (generated upon approval)
ALTER TABLE licenses ALTER COLUMN license_key DROP NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- Update RLS to allow public insertion (Registration)
-- Note: Adjust policy name if it conflicts with existing ones
CREATE POLICY "Public can insert pending license requests" ON licenses
  FOR INSERT WITH CHECK (status = 'PENDING');
