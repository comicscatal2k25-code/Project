-- Check if the comic-images storage bucket exists and is properly configured
-- Run this in your Supabase SQL editor to diagnose storage issues

-- Check if the bucket exists
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'comic-images';

-- Check storage policies for the bucket
SELECT 
  name as policy_name,
  operation,
  definition
FROM storage.policies 
WHERE bucket_id = 'comic-images';

-- Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check current user and permissions
SELECT 
  current_user,
  session_user,
  current_database();

-- If the bucket doesn't exist, you'll need to create it in the Supabase Dashboard:
-- 1. Go to Storage → Buckets
-- 2. Click "New bucket"
-- 3. Name: comic-images
-- 4. Make it public
-- 5. Set file size limit to 50MB
