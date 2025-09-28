-- Create audit_logs table for tracking report generation and other analytics events
-- This version avoids foreign key constraints that might cause issues

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now, but in production you'd want more restrictive policies)
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs
  FOR ALL USING (true);

-- Note: The reports storage bucket should be created through Supabase dashboard:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket named 'reports'
-- 3. Set it to public if you want direct access to files
-- 4. Or keep it private and use signed URLs (recommended for security)
