-- Setup Supabase Storage bucket for comic images
-- This script only adds the image_url column to the comics table
-- Storage bucket and policies must be set up through the Supabase Dashboard

-- Add image_url column to comics table
ALTER TABLE public.comics 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for better performance when querying by image_url
CREATE INDEX IF NOT EXISTS idx_comics_image_url ON public.comics(image_url) WHERE image_url IS NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN public.comics.image_url IS 'URL of the comic cover image stored in Supabase Storage';

-- IMPORTANT: Storage bucket and policies must be set up through the Supabase Dashboard:
-- 
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Name it "comic-images"
-- 4. Make it public if you want direct access to images
-- 5. Set up storage policies through the Dashboard UI (not SQL)
-- 
-- See IMAGE_UPLOAD_SETUP.md for detailed instructions
