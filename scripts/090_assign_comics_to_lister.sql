-- Assign existing comics to the lister user
-- This script will update the user_id of all comics to the lister user

-- First, let's see the current comics and their owners
SELECT 
    id,
    title,
    user_id,
    created_at
FROM comics 
ORDER BY created_at DESC;

-- Get the lister user ID
SELECT 
    id,
    username,
    full_name,
    role
FROM profiles 
WHERE username = 'lister';

-- Update all comics to belong to the lister user
UPDATE comics 
SET user_id = (
    SELECT id 
    FROM profiles 
    WHERE username = 'lister'
)
WHERE user_id = 'be381bae-a3f5-4d75-aed6-b7655af12afc';

-- Verify the update
SELECT 
    id,
    title,
    user_id,
    created_at
FROM comics 
ORDER BY created_at DESC;

-- Count comics for each user
SELECT 
    p.username,
    p.full_name,
    p.role,
    COUNT(c.id) as comic_count
FROM profiles p
LEFT JOIN comics c ON p.id = c.user_id
GROUP BY p.id, p.username, p.full_name, p.role
ORDER BY comic_count DESC;
