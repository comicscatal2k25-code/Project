-- Fix RLS policies for Shopify image storage
-- This script creates the necessary storage bucket and policies for image uploads

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

-- Create RLS policy to allow all operations on shopify_images bucket
-- This is needed for the image processing to work
CREATE POLICY "Allow all operations on shopify_images" ON storage.objects
FOR ALL USING (bucket_id = 'shopify_images');

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

-- Create a more permissive policy for authenticated users
CREATE POLICY "Authenticated users can manage files" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated');

-- Test the setup
SELECT 'RLS policies updated successfully for Shopify image storage' as status;
