-- Create audit_logs table for tracking report generation and other analytics events
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

-- Create reports storage bucket if it doesn't exist
-- Note: This would typically be done through Supabase dashboard, but we'll document it here
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);

-- Create storage policies for reports bucket
-- CREATE POLICY "Allow authenticated users to upload reports" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated users to download reports" ON storage.objects
--   FOR SELECT USING (bucket_id = 'reports' AND auth.role() = 'authenticated');
