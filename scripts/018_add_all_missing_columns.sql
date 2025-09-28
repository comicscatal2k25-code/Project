-- Add all missing columns to comics table
-- Run this in your Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'comics'
ORDER BY ordinal_position;

-- Add missing columns one by one
DO $$
BEGIN
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column';
    END IF;

    -- Add grade column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN grade NUMERIC(3,1);
        RAISE NOTICE 'Added grade column';
    END IF;

    -- Add condition column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'condition'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN condition TEXT;
        RAISE NOTICE 'Added condition column';
    END IF;

    -- Add current_value column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'current_value'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN current_value NUMERIC(10, 2);
        RAISE NOTICE 'Added current_value column';
    END IF;

    -- Add acquired_price column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'acquired_price'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN acquired_price NUMERIC(10, 2);
        RAISE NOTICE 'Added acquired_price column';
    END IF;

    -- Add for_sale column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'for_sale'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN for_sale BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added for_sale column';
    END IF;

    -- Add series column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'series'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN series TEXT;
        RAISE NOTICE 'Added series column';
    END IF;

    -- Add publisher column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'publisher'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN publisher TEXT;
        RAISE NOTICE 'Added publisher column';
    END IF;

    -- Add issue_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'issue_number'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN issue_number TEXT;
        RAISE NOTICE 'Added issue_number column';
    END IF;

    -- Update existing comics with your user ID
    UPDATE public.comics 
    SET user_id = (
        SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
    )
    WHERE user_id IS NULL;

    -- Make user_id NOT NULL after updating
    ALTER TABLE public.comics ALTER COLUMN user_id SET NOT NULL;

    RAISE NOTICE 'All columns added and comics updated successfully';
END $$;

-- Verify the final structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'comics'
ORDER BY ordinal_position;

-- Show sample data
SELECT id, title, issue_number, publisher, series, condition, grade, current_value, acquired_price, for_sale, user_id
FROM public.comics 
LIMIT 3;
