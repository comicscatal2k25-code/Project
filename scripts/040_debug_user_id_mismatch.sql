-- Debug script to check the exact user_id mismatch
-- This will help us understand why the API is finding 0 comics

-- 1. Check all comics with their exact user_id values
SELECT 'All comics with user_id:' as info, id, title, user_id, created_at FROM comics ORDER BY created_at DESC;

-- 2. Check the exact user_id format in profiles table
SELECT 'Admin profile user_id:' as info, user_id, username, role FROM profiles WHERE username = 'admin' AND role = 'admin';

-- 3. Check if there are any comics with the exact user_id from the session
SELECT 'Comics with session user_id:' as info, COUNT(*) as count 
FROM comics 
WHERE user_id = 'be381bae-a3f5-4d75-aed6-b7655af12afc';

-- 4. Check if there are any comics with the old admin user_id
SELECT 'Comics with old admin user_id:' as info, COUNT(*) as count 
FROM comics 
WHERE user_id = '94d2bf6d-81ba-4c01-a6fa-8ed4ae51ac7d';

-- 5. Show the exact user_id values in comics table
SELECT 'Unique user_ids in comics:' as info, user_id, COUNT(*) as comic_count 
FROM comics 
GROUP BY user_id;
