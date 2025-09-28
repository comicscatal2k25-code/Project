-- Test the exact query that the API is using
-- This will help us understand why the API is finding 0 comics

-- 1. Test the exact query from the API
SELECT 
  id,
  title,
  created_at,
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
  tags,
  handle,
  product_type,
  vendor,
  barcode,
  image_url
FROM comics
WHERE user_id = 'be381bae-a3f5-4d75-aed6-b7655af12afc'
ORDER BY created_at DESC;

-- 2. Test a simpler query to see if it works
SELECT COUNT(*) as total_comics FROM comics WHERE user_id = 'be381bae-a3f5-4d75-aed6-b7655af12afc';

-- 3. Test if RLS is blocking the query
SELECT 'RLS status:' as info, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'comics' AND schemaname = 'public';

-- 4. Test if there are any policies on the comics table
SELECT 'Policies on comics:' as info, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'comics' AND schemaname = 'public';
