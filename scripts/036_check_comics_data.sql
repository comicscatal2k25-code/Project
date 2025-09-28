-- Check current comics data and user IDs
SELECT 
    c.id,
    c.title,
    c.user_id,
    c.created_at,
    p.username,
    p.role
FROM comics c
LEFT JOIN profiles p ON c.user_id = p.user_id
ORDER BY c.created_at DESC
LIMIT 10;
