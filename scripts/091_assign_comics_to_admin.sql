-- Assign all comics to admin user for shared catalog
-- This script will update all comics to belong to the admin user

-- First, let's see the current comics and their owners
SELECT 
    id,
    title,
    user_id,
    created_at
FROM comics 
ORDER BY created_at DESC;

-- Get the admin user ID
SELECT 
    id,
    username,
    full_name,
    role
FROM profiles 
WHERE username = 'admin';

-- Update all comics to belong to the admin user
UPDATE comics 
SET user_id = (
    SELECT id 
    FROM profiles 
    WHERE username = 'admin'
);

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
