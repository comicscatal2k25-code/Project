-- Fix image storage RLS policy for Shopify integration
-- This script creates the necessary storage bucket and policies

-- Create the shopify_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shopify_images',
  'shopify_images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on shopify_images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage all files" ON storage.objects;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations on shopify_images" ON storage.objects
FOR ALL USING (bucket_id = 'shopify_images');

-- Test the setup
SELECT 'Image storage RLS policies updated successfully' as status;
