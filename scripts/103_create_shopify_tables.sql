-- Migration: Create Shopify integration tables
-- Up migration for Shopify store connections and publish jobs

-- Create store_connections table
CREATE TABLE IF NOT EXISTS store_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  shopify_shop VARCHAR(255) NOT NULL UNIQUE,
  oauth_access_token TEXT NOT NULL, -- encrypted
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create publish_jobs table
CREATE TABLE IF NOT EXISTS publish_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  store_connection_id UUID REFERENCES store_connections(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('api_publish', 'csv_export')),
  payload_summary JSONB,
  rows_total INTEGER DEFAULT 0,
  rows_success INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create publish_job_rows table for per-row status
CREATE TABLE IF NOT EXISTS publish_job_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publish_job_id UUID NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE,
  local_variant_id UUID REFERENCES comic_variants(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  error_message TEXT,
  shopify_product_id VARCHAR(255),
  shopify_variant_id VARCHAR(255),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_store_connections_shop ON store_connections(shopify_shop);
CREATE INDEX IF NOT EXISTS idx_store_connections_created_by ON store_connections(created_by);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_user_id ON publish_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_store_connection ON publish_jobs(store_connection_id);
CREATE INDEX IF NOT EXISTS idx_publish_job_rows_job_id ON publish_job_rows(publish_job_id);
CREATE INDEX IF NOT EXISTS idx_publish_job_rows_status ON publish_job_rows(status);
CREATE INDEX IF NOT EXISTS idx_publish_job_rows_variant_id ON publish_job_rows(local_variant_id);

-- Enable RLS
ALTER TABLE store_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_job_rows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Store connections: only admin can manage
CREATE POLICY "Admin can manage store connections" ON store_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Publish jobs: users can see their own, admin can see all
CREATE POLICY "Users can manage their own publish jobs" ON publish_jobs
  FOR ALL USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Publish job rows: same as publish jobs
CREATE POLICY "Users can manage their own publish job rows" ON publish_job_rows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM publish_jobs 
      WHERE publish_jobs.id = publish_job_rows.publish_job_id 
      AND (
        publish_jobs.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_connections_updated_at 
  BEFORE UPDATE ON store_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publish_jobs_updated_at 
  BEFORE UPDATE ON publish_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publish_job_rows_updated_at 
  BEFORE UPDATE ON publish_job_rows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test the tables
SELECT 'Shopify integration tables created successfully' as status;
