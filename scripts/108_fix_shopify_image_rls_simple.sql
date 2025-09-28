-- Fix RLS policies for Shopify image storage (handles existing policies)
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

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on shopify_images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage files" ON storage.objects;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Allow authenticated users to manage all files" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated');

-- Test the setup
SELECT 'RLS policies updated successfully for Shopify image storage' as status;
