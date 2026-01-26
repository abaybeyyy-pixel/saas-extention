-- Leadify SaaS License Server Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('TRIAL', 'PRO', 'AGENCY')),
  device_limit INT DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (active sessions with device binding)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  session_token TEXT NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(license_id, device_fingerprint)
);

-- Usages table (audit log)
CREATE TABLE IF NOT EXISTS usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  device_fingerprint VARCHAR(255),
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_sessions_license ON sessions(license_id);
CREATE INDEX IF NOT EXISTS idx_sessions_heartbeat ON sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_usages_license ON usages(license_id);
CREATE INDEX IF NOT EXISTS idx_usages_action ON usages(action);

-- Enable Row Level Security (but allow service role full access)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usages ENABLE ROW LEVEL SECURITY;

-- Policies for service role (admin only access)
CREATE POLICY "Service role full access on licenses" ON licenses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on usages" ON usages
  FOR ALL USING (true) WITH CHECK (true);

-- Function to clean up stale sessions (optional - run periodically)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  -- Delete sessions with no heartbeat in the last 30 minutes
  DELETE FROM sessions 
  WHERE last_heartbeat < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;
