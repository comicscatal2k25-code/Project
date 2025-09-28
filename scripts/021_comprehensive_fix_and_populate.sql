-- Comprehensive fix for enum issues and metadata population
-- This script will handle all enum-related problems

-- First, let's check what enums exist and their values
DO $$
DECLARE
    enum_name TEXT;
    enum_values TEXT[];
BEGIN
    -- Check if there are any enum types in the database
    SELECT t.typname INTO enum_name
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname LIKE '%comic%' OR t.typname LIKE '%condition%'
    LIMIT 1;
    
    IF enum_name IS NOT NULL THEN
        RAISE NOTICE 'Found enum type: %', enum_name;
        
        -- Get all enum values
        SELECT ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) INTO enum_values
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = enum_name;
        
        RAISE NOTICE 'Enum values: %', enum_values;
    ELSE
        RAISE NOTICE 'No comic-related enum types found';
    END IF;
END $$;

-- Now let's fix the condition column specifically
DO $$
BEGIN
    -- Check if condition column exists and what type it is
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'condition'
    ) THEN
        RAISE NOTICE 'Condition column exists, checking type...';
        
        -- Check if it's an enum type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns c
            JOIN pg_type t ON c.udt_name = t.typname
            WHERE c.table_schema = 'public' 
            AND c.table_name = 'comics' 
            AND c.column_name = 'condition'
            AND t.typtype = 'e'  -- 'e' means enum type
        ) THEN
            RAISE NOTICE 'Condition column is an enum type, converting to TEXT...';
            
            -- Convert enum to text
            ALTER TABLE public.comics ALTER COLUMN condition TYPE TEXT USING condition::TEXT;
            RAISE NOTICE 'Successfully converted condition column to TEXT';
        ELSE
            RAISE NOTICE 'Condition column is not an enum type';
        END IF;
    ELSE
        RAISE NOTICE 'Condition column does not exist, creating it as TEXT';
        ALTER TABLE public.comics ADD COLUMN condition TEXT;
    END IF;
END $$;

-- Fix other potential enum columns
DO $$
BEGIN
    -- Fix era column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns c
        JOIN pg_type t ON c.udt_name = t.typname
        WHERE c.table_schema = 'public' 
        AND c.table_name = 'comics' 
        AND c.column_name = 'era'
        AND t.typtype = 'e'
    ) THEN
        ALTER TABLE public.comics ALTER COLUMN era TYPE TEXT USING era::TEXT;
        RAISE NOTICE 'Converted era column to TEXT';
    END IF;
    
    -- Fix publisher column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns c
        JOIN pg_type t ON c.udt_name = t.typname
        WHERE c.table_schema = 'public' 
        AND c.table_name = 'comics' 
        AND c.column_name = 'publisher'
        AND t.typtype = 'e'
    ) THEN
        ALTER TABLE public.comics ALTER COLUMN publisher TYPE TEXT USING publisher::TEXT;
        RAISE NOTICE 'Converted publisher column to TEXT';
    END IF;
    
    -- Fix grading_service column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns c
        JOIN pg_type t ON c.udt_name = t.typname
        WHERE c.table_schema = 'public' 
        AND c.table_name = 'comics' 
        AND c.column_name = 'grading_service'
        AND t.typtype = 'e'
    ) THEN
        ALTER TABLE public.comics ALTER COLUMN grading_service TYPE TEXT USING grading_service::TEXT;
        RAISE NOTICE 'Converted grading_service column to TEXT';
    END IF;
END $$;

-- Now let's add all the missing columns we need
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'handle') THEN
        ALTER TABLE public.comics ADD COLUMN handle TEXT;
        RAISE NOTICE 'Added handle column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'body_html') THEN
        ALTER TABLE public.comics ADD COLUMN body_html TEXT;
        RAISE NOTICE 'Added body_html column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'vendor') THEN
        ALTER TABLE public.comics ADD COLUMN vendor TEXT;
        RAISE NOTICE 'Added vendor column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'product_type') THEN
        ALTER TABLE public.comics ADD COLUMN product_type TEXT DEFAULT 'Comic Book';
        RAISE NOTICE 'Added product_type column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'tags') THEN
        ALTER TABLE public.comics ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'published') THEN
        ALTER TABLE public.comics ADD COLUMN published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added published column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'current_value') THEN
        ALTER TABLE public.comics ADD COLUMN current_value NUMERIC(10, 2);
        RAISE NOTICE 'Added current_value column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'acquired_price') THEN
        ALTER TABLE public.comics ADD COLUMN acquired_price NUMERIC(10, 2);
        RAISE NOTICE 'Added acquired_price column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'compare_at_price') THEN
        ALTER TABLE public.comics ADD COLUMN compare_at_price NUMERIC(10, 2);
        RAISE NOTICE 'Added compare_at_price column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'inventory_quantity') THEN
        ALTER TABLE public.comics ADD COLUMN inventory_quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Added inventory_quantity column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'barcode') THEN
        ALTER TABLE public.comics ADD COLUMN barcode TEXT;
        RAISE NOTICE 'Added barcode column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'grade') THEN
        ALTER TABLE public.comics ADD COLUMN grade NUMERIC(3,1);
        RAISE NOTICE 'Added grade column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'grading_service') THEN
        ALTER TABLE public.comics ADD COLUMN grading_service TEXT;
        RAISE NOTICE 'Added grading_service column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'slab_id') THEN
        ALTER TABLE public.comics ADD COLUMN slab_id TEXT;
        RAISE NOTICE 'Added slab_id column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'is_slabbed') THEN
        ALTER TABLE public.comics ADD COLUMN is_slabbed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_slabbed column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'is_key_issue') THEN
        ALTER TABLE public.comics ADD COLUMN is_key_issue BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_key_issue column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'key_issue_notes') THEN
        ALTER TABLE public.comics ADD COLUMN key_issue_notes TEXT;
        RAISE NOTICE 'Added key_issue_notes column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'for_sale') THEN
        ALTER TABLE public.comics ADD COLUMN for_sale BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added for_sale column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'published_to_shopify') THEN
        ALTER TABLE public.comics ADD COLUMN published_to_shopify BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added published_to_shopify column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'series') THEN
        ALTER TABLE public.comics ADD COLUMN series TEXT;
        RAISE NOTICE 'Added series column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'issue_number') THEN
        ALTER TABLE public.comics ADD COLUMN issue_number TEXT;
        RAISE NOTICE 'Added issue_number column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'printing_suffix') THEN
        ALTER TABLE public.comics ADD COLUMN printing_suffix TEXT;
        RAISE NOTICE 'Added printing_suffix column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'era') THEN
        ALTER TABLE public.comics ADD COLUMN era TEXT;
        RAISE NOTICE 'Added era column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'publisher') THEN
        ALTER TABLE public.comics ADD COLUMN publisher TEXT;
        RAISE NOTICE 'Added publisher column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'release_date') THEN
        ALTER TABLE public.comics ADD COLUMN release_date DATE;
        RAISE NOTICE 'Added release_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'cover_date') THEN
        ALTER TABLE public.comics ADD COLUMN cover_date DATE;
        RAISE NOTICE 'Added cover_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comics' AND column_name = 'updated_at') THEN
        ALTER TABLE public.comics ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Now populate the data safely
DO $$
DECLARE
    user_uuid UUID;
    comic_count INTEGER;
BEGIN
    -- Find the ID of the first user in auth.users
    SELECT id INTO user_uuid FROM auth.users LIMIT 1;

    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'No user found in auth.users table. Please create a user first.';
    END IF;

    RAISE NOTICE 'Using user ID: %', user_uuid;
    
    -- Count existing comics
    SELECT COUNT(*) INTO comic_count FROM public.comics WHERE user_id = user_uuid;
    RAISE NOTICE 'Found % comics to update', comic_count;

    -- Update existing comics with realistic data
    UPDATE public.comics 
    SET 
        -- Generate handles from titles
        handle = LOWER(REPLACE(REPLACE(title, ' ', '-'), '''', '')),
        
        -- Set realistic prices based on comic titles
        current_value = CASE 
            WHEN title ILIKE '%spider-man%' THEN 150.00
            WHEN title ILIKE '%batman%' THEN 200.00
            WHEN title ILIKE '%x-men%' THEN 175.00
            WHEN title ILIKE '%hulk%' THEN 125.00
            WHEN title ILIKE '%flash%' THEN 100.00
            WHEN title ILIKE '%superman%' THEN 180.00
            WHEN title ILIKE '%wonder woman%' THEN 160.00
            WHEN title ILIKE '%iron man%' THEN 140.00
            ELSE 120.00
        END,
        
        -- Set acquired prices (usually lower than current value)
        acquired_price = CASE 
            WHEN title ILIKE '%spider-man%' THEN 75.00
            WHEN title ILIKE '%batman%' THEN 100.00
            WHEN title ILIKE '%x-men%' THEN 85.00
            WHEN title ILIKE '%hulk%' THEN 60.00
            WHEN title ILIKE '%flash%' THEN 50.00
            WHEN title ILIKE '%superman%' THEN 90.00
            WHEN title ILIKE '%wonder woman%' THEN 80.00
            WHEN title ILIKE '%iron man%' THEN 70.00
            ELSE 60.00
        END,
        
        -- Set compare at prices (usually higher than current value)
        compare_at_price = CASE 
            WHEN title ILIKE '%spider-man%' THEN 200.00
            WHEN title ILIKE '%batman%' THEN 250.00
            WHEN title ILIKE '%x-men%' THEN 225.00
            WHEN title ILIKE '%hulk%' THEN 175.00
            WHEN title ILIKE '%flash%' THEN 150.00
            WHEN title ILIKE '%superman%' THEN 230.00
            WHEN title ILIKE '%wonder woman%' THEN 210.00
            WHEN title ILIKE '%iron man%' THEN 190.00
            ELSE 160.00
        END,
        
        -- Set inventory quantities
        inventory_quantity = CASE 
            WHEN title ILIKE '%spider-man%' THEN 2
            WHEN title ILIKE '%batman%' THEN 1
            WHEN title ILIKE '%x-men%' THEN 3
            WHEN title ILIKE '%hulk%' THEN 2
            WHEN title ILIKE '%flash%' THEN 1
            WHEN title ILIKE '%superman%' THEN 2
            WHEN title ILIKE '%wonder woman%' THEN 1
            WHEN title ILIKE '%iron man%' THEN 2
            ELSE 1
        END,
        
        -- Set conditions (now using TEXT)
        condition = CASE 
            WHEN RANDOM() < 0.2 THEN 'Mint'
            WHEN RANDOM() < 0.4 THEN 'Near Mint'
            WHEN RANDOM() < 0.6 THEN 'Very Fine'
            WHEN RANDOM() < 0.8 THEN 'Fine'
            ELSE 'Very Good'
        END,
        
        -- Set grades
        grade = CASE 
            WHEN condition = 'Mint' THEN 10.0
            WHEN condition = 'Near Mint' THEN 9.8
            WHEN condition = 'Very Fine' THEN 9.4
            WHEN condition = 'Fine' THEN 8.5
            ELSE 7.5
        END,
        
        -- Set grading services
        grading_service = CASE 
            WHEN grade >= 9.5 THEN 'CGC'
            WHEN grade >= 8.0 THEN 'CBCS'
            ELSE 'PGX'
        END,
        
        -- Set some comics as key issues
        is_key_issue = CASE 
            WHEN title ILIKE '%spider-man%' AND issue_number::INTEGER = 121 THEN TRUE
            WHEN title ILIKE '%batman%' AND issue_number::INTEGER = 227 THEN TRUE
            WHEN title ILIKE '%x-men%' AND issue_number::INTEGER = 94 THEN TRUE
            WHEN title ILIKE '%hulk%' AND issue_number::INTEGER = 181 THEN TRUE
            ELSE FALSE
        END,
        
        -- Set some comics for sale
        for_sale = CASE 
            WHEN RANDOM() < 0.3 THEN TRUE
            ELSE FALSE
        END,
        
        -- Set publishers
        publisher = CASE 
            WHEN title ILIKE '%spider-man%' OR title ILIKE '%x-men%' OR title ILIKE '%hulk%' OR title ILIKE '%iron man%' THEN 'Marvel Comics'
            WHEN title ILIKE '%batman%' OR title ILIKE '%superman%' OR title ILIKE '%wonder woman%' OR title ILIKE '%flash%' THEN 'DC Comics'
            ELSE 'Independent'
        END,
        
        -- Set series names
        series = CASE 
            WHEN title ILIKE '%spider-man%' THEN 'The Amazing Spider-Man'
            WHEN title ILIKE '%batman%' THEN 'Batman'
            WHEN title ILIKE '%x-men%' THEN 'X-Men'
            WHEN title ILIKE '%hulk%' THEN 'The Incredible Hulk'
            WHEN title ILIKE '%flash%' THEN 'The Flash'
            WHEN title ILIKE '%superman%' THEN 'Superman'
            WHEN title ILIKE '%wonder woman%' THEN 'Wonder Woman'
            WHEN title ILIKE '%iron man%' THEN 'Iron Man'
            ELSE title
        END,
        
        -- Set eras
        era = CASE 
            WHEN issue_number::INTEGER < 1956 THEN 'Golden Age'
            WHEN issue_number::INTEGER < 1970 THEN 'Silver Age'
            WHEN issue_number::INTEGER < 1985 THEN 'Bronze Age'
            ELSE 'Modern'
        END,
        
        -- Set product types
        product_type = 'Comic Book',
        
        -- Set tags
        tags = CASE 
            WHEN title ILIKE '%spider-man%' THEN ARRAY['superhero', 'marvel', 'spider-man']
            WHEN title ILIKE '%batman%' THEN ARRAY['superhero', 'dc', 'batman']
            WHEN title ILIKE '%x-men%' THEN ARRAY['superhero', 'marvel', 'x-men']
            WHEN title ILIKE '%hulk%' THEN ARRAY['superhero', 'marvel', 'hulk']
            WHEN title ILIKE '%flash%' THEN ARRAY['superhero', 'dc', 'flash']
            WHEN title ILIKE '%superman%' THEN ARRAY['superhero', 'dc', 'superman']
            WHEN title ILIKE '%wonder woman%' THEN ARRAY['superhero', 'dc', 'wonder-woman']
            WHEN title ILIKE '%iron man%' THEN ARRAY['superhero', 'marvel', 'iron-man']
            ELSE ARRAY['comic', 'collectible']
        END,
        
        -- Set descriptions
        body_html = '<p>A collectible comic book in ' || condition || ' condition. ' || 
                    CASE WHEN is_key_issue THEN 'This is a key issue with significant historical importance. ' ELSE '' END ||
                    'Perfect for collectors and comic book enthusiasts.</p>',
        
        -- Set vendors
        vendor = publisher,
        
        -- Generate barcodes
        barcode = LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0'),
        
        -- Update timestamp
        updated_at = now()
        
    WHERE user_id = user_uuid;

    RAISE NOTICE 'Successfully updated % comics with metadata', FOUND;
END $$;

-- Verify the updates
SELECT 
    title,
    current_value,
    acquired_price,
    compare_at_price,
    inventory_quantity,
    condition,
    grade,
    grading_service,
    is_key_issue,
    for_sale,
    publisher,
    series,
    era,
    tags
FROM public.comics 
WHERE user_id = (
    SELECT id FROM auth.users LIMIT 1
)
LIMIT 5;
