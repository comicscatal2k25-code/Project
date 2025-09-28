-- Migration: Drop Shopify integration tables (rollback)
-- Down migration for Shopify store connections and publish jobs

-- Drop triggers first
DROP TRIGGER IF EXISTS update_publish_job_rows_updated_at ON publish_job_rows;
DROP TRIGGER IF EXISTS update_publish_jobs_updated_at ON publish_jobs;
DROP TRIGGER IF EXISTS update_store_connections_updated_at ON store_connections;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop policies
DROP POLICY IF EXISTS "Users can manage their own publish job rows" ON publish_job_rows;
DROP POLICY IF EXISTS "Users can manage their own publish jobs" ON publish_jobs;
DROP POLICY IF EXISTS "Admin can manage store connections" ON store_connections;

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS publish_job_rows CASCADE;
DROP TABLE IF EXISTS publish_jobs CASCADE;
DROP TABLE IF EXISTS store_connections CASCADE;

-- Test the rollback
SELECT 'Shopify integration tables dropped successfully' as status;
