-- Check all RLS policies that might be causing the user_id column error

-- Check RLS policies on all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE qual LIKE '%user_id%' OR qual LIKE '%auth.uid()%'
ORDER BY tablename, policyname;

-- Check if RLS is enabled on any tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY tablename;
