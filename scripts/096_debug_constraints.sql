-- Debug script to find what's causing the user_id column error

-- Check all foreign key constraints that reference user_id
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (kcu.column_name = 'user_id' OR ccu.column_name = 'user_id');

-- Check RLS policies that might reference user_id
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE qual LIKE '%user_id%' OR qual LIKE '%auth.uid()%';

-- Check if there are any views or functions that reference user_id
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'user_id' 
ORDER BY table_name;
