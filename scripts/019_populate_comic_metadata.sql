-- Update existing comics with proper metadata
-- Run this in your Supabase SQL Editor

-- First, let's add some additional columns that might be missing
DO $$
BEGIN
    -- Add inventory quantity column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'inventory_quantity'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN inventory_quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Added inventory_quantity column';
    END IF;

    -- Add compare_at_price column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'compare_at_price'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN compare_at_price NUMERIC(10, 2);
        RAISE NOTICE 'Added compare_at_price column';
    END IF;

    -- Add barcode column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'barcode'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN barcode TEXT;
        RAISE NOTICE 'Added barcode column';
    END IF;

    -- Add handle column for Shopify
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'handle'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN handle TEXT;
        RAISE NOTICE 'Added handle column';
    END IF;

    -- Add body_html column for descriptions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'body_html'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN body_html TEXT;
        RAISE NOTICE 'Added body_html column';
    END IF;

    -- Add vendor column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'vendor'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN vendor TEXT;
        RAISE NOTICE 'Added vendor column';
    END IF;

    -- Add product_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'product_type'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN product_type TEXT DEFAULT 'Comic Book';
        RAISE NOTICE 'Added product_type column';
    END IF;

    -- Add tags column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    END IF;

    -- Add published column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comics' 
        AND column_name = 'published'
    ) THEN
        ALTER TABLE public.comics ADD COLUMN published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added published column';
    END IF;
END $$;

-- Now update existing comics with realistic data
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
    
    -- Set conditions
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
    
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
);

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
    SELECT id FROM auth.users WHERE email = 'mailforbucks645@gmail.com'
)
LIMIT 5;
