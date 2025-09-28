-- Add image_url column to comics table for storing comic cover images
-- This script adds the image_url column to the existing comics table

-- Add image_url column to comics table
ALTER TABLE public.comics 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for better performance when querying by image_url
CREATE INDEX IF NOT EXISTS idx_comics_image_url ON public.comics(image_url) WHERE image_url IS NOT NULL;

-- Update existing comics with placeholder images (optional)
-- You can uncomment this section if you want to add placeholder images to existing comics
/*
UPDATE public.comics 
SET image_url = CASE 
  WHEN title ILIKE '%spider-man%' THEN 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop&auto=format'
  WHEN title ILIKE '%batman%' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&auto=format'
  WHEN title ILIKE '%x-men%' THEN 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop&auto=format'
  WHEN title ILIKE '%hulk%' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&auto=format'
  WHEN title ILIKE '%flash%' THEN 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop&auto=format'
  ELSE 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop&auto=format'
END
WHERE image_url IS NULL;
*/

-- Add comment to the column
COMMENT ON COLUMN public.comics.image_url IS 'URL of the comic cover image stored in Supabase Storage or external service';
