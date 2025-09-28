-- Fix the condition enum issue
-- First, let's check what the current condition column type is and fix it

-- Check if condition column exists and what type it is
DO $$
BEGIN
    -- Check if condition column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'condition'
    ) THEN
        RAISE NOTICE 'Condition column exists';
        
        -- Check if it's an enum type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'comics' 
            AND column_name = 'condition'
            AND udt_name LIKE '%enum%'
        ) THEN
            RAISE NOTICE 'Condition column is an enum type';
            
            -- Drop the enum constraint and convert to text
            ALTER TABLE public.comics ALTER COLUMN condition TYPE TEXT;
            RAISE NOTICE 'Converted condition column to TEXT type';
        ELSE
            RAISE NOTICE 'Condition column is not an enum type';
        END IF;
    ELSE
        RAISE NOTICE 'Condition column does not exist, creating it';
        ALTER TABLE public.comics ADD COLUMN condition TEXT;
    END IF;
END $$;

-- Now let's also check and fix other potential enum columns
DO $$
BEGIN
    -- Check era column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'era'
        AND udt_name LIKE '%enum%'
    ) THEN
        ALTER TABLE public.comics ALTER COLUMN era TYPE TEXT;
        RAISE NOTICE 'Converted era column to TEXT type';
    END IF;
    
    -- Check publisher column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'publisher'
        AND udt_name LIKE '%enum%'
    ) THEN
        ALTER TABLE public.comics ALTER COLUMN publisher TYPE TEXT;
        RAISE NOTICE 'Converted publisher column to TEXT type';
    END IF;
    
    -- Check grading_service column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'grading_service'
        AND udt_name LIKE '%enum%'
    ) THEN
        ALTER TABLE public.comics ALTER COLUMN grading_service TYPE TEXT;
        RAISE NOTICE 'Converted grading_service column to TEXT type';
    END IF;
END $$;

-- Now run the metadata population script
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Find the ID of the first user in auth.users
    SELECT id INTO user_uuid FROM auth.users LIMIT 1;

    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'No user found in auth.users table. Please create a user first.';
    END IF;

    RAISE NOTICE 'Using user ID: %', user_uuid;

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
        barcode = LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0')
        
    WHERE user_id = user_uuid;

    RAISE NOTICE 'Updated % comics with metadata', FOUND;
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
