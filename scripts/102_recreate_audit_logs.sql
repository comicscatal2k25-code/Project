-- Drop the existing audit_logs table and recreate it properly
-- This will resolve the column conflicts

-- Drop the existing table
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create the audit_logs table with the correct structure
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_audit_logs_profile_id ON audit_logs(profile_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create a simple RLS policy (allow all operations for now)
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs
  FOR ALL USING (true);

-- Test the table creation
SELECT 'Audit logs table created successfully' as status;
SELECT COUNT(*) as record_count FROM audit_logs;
