-- Debug script to check comics table and user associations
-- This will help us understand why comics aren't showing

-- 1. Check if there are any comics at all
SELECT 'Total comics count:' as info, COUNT(*) as count FROM comics;

-- 2. Check all comics with their user IDs
SELECT 'All comics:' as info, id, title, user_id, created_at FROM comics ORDER BY created_at DESC LIMIT 10;

-- 3. Check the admin user ID
SELECT 'Admin user:' as info, user_id, username, role FROM profiles WHERE username = 'admin' AND role = 'admin';

-- 4. Check if any comics belong to the admin user
SELECT 'Comics belonging to admin:' as info, COUNT(*) as count 
FROM comics c 
JOIN profiles p ON c.user_id = p.user_id 
WHERE p.username = 'admin' AND p.role = 'admin';

-- 5. Check all user IDs in profiles table
SELECT 'All profiles:' as info, user_id, username, role, email FROM profiles;

-- 6. Check if there are any comics with user_ids that don't match any profile
SELECT 'Orphaned comics:' as info, c.id, c.title, c.user_id 
FROM comics c 
LEFT JOIN profiles p ON c.user_id = p.user_id 
WHERE p.user_id IS NULL;
