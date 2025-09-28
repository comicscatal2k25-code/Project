-- Add user_id column to existing comics table
-- Run this in your Supabase SQL Editor

-- First, check if user_id column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE public.comics 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Update existing comics with your user ID
        UPDATE public.comics 
        SET user_id = (
            SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
        )
        WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL after updating
        ALTER TABLE public.comics 
        ALTER COLUMN user_id SET NOT NULL;
        
        RAISE NOTICE 'user_id column added and populated successfully';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Verify the update
SELECT COUNT(*) as comics_with_user_id 
FROM public.comics 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
);

-- Show sample comics with user_id
SELECT id, title, issue_number, user_id 
FROM public.comics 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
)
LIMIT 5;
