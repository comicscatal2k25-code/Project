-- Quick fix for storage RLS policy issues
-- This script helps resolve "new row violates row-level security policy" errors

-- Check current bucket status
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'comic-images';

-- Check existing policies
SELECT 
  name as policy_name,
  operation,
  definition
FROM storage.policies 
WHERE bucket_id = 'comic-images';

-- If you're getting RLS policy errors, try one of these solutions:

-- SOLUTION 1: Make the bucket public (easiest)
-- Go to Supabase Dashboard → Storage → Buckets → comic-images → Toggle "Public bucket" ON

-- SOLUTION 2: Create a simple INSERT policy
-- Go to Supabase Dashboard → Storage → Policies → New Policy
-- Policy Name: Allow authenticated uploads
-- Operation: INSERT
-- Target Roles: authenticated
-- Policy Definition: bucket_id = 'comic-images'

-- SOLUTION 3: Disable RLS temporarily (not recommended for production)
-- This would require superuser access and is not recommended

-- The bucket should be public for the easiest setup
