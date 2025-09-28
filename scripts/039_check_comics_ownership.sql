-- Check comics ownership and migrate to new admin user
-- This will show us exactly what's happening with the comics

-- 1. Check total comics count
SELECT 'Total comics count:' as info, COUNT(*) as count FROM comics;

-- 2. Check all comics with their user IDs
SELECT 'All comics:' as info, id, title, user_id, created_at FROM comics ORDER BY created_at DESC LIMIT 10;

-- 3. Check which user IDs the comics belong to
SELECT 'Comics by user_id:' as info, user_id, COUNT(*) as comic_count 
FROM comics 
GROUP BY user_id;

-- 4. Check if comics belong to the old admin user
SELECT 'Comics belonging to old admin:' as info, COUNT(*) as count 
FROM comics 
WHERE user_id = '94d2bf6d-81ba-4c01-a6fa-8ed4ae51ac7d';

-- 5. Check if comics belong to the new admin user
SELECT 'Comics belonging to new admin:' as info, COUNT(*) as count 
FROM comics 
WHERE user_id = 'be381bae-a3f5-4d75-aed6-b7655af12afc';
