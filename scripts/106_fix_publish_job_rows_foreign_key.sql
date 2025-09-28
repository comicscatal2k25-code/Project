-- Fix publish_job_rows foreign key constraint to reference comics instead of comic_variants
-- This script updates the foreign key constraint to work with our current comic-based system

-- Drop the existing foreign key constraint
ALTER TABLE publish_job_rows DROP CONSTRAINT IF EXISTS publish_job_rows_local_variant_id_fkey;

-- Add new foreign key constraint to reference comics table
ALTER TABLE publish_job_rows ADD CONSTRAINT publish_job_rows_local_variant_id_fkey 
  FOREIGN KEY (local_variant_id) REFERENCES comics(id) ON DELETE CASCADE;

-- Update the index name to be more accurate
DROP INDEX IF EXISTS idx_publish_job_rows_variant_id;
CREATE INDEX IF NOT EXISTS idx_publish_job_rows_comic_id ON publish_job_rows(local_variant_id);

-- Test the constraint
SELECT 'Foreign key constraint updated successfully' as status;
