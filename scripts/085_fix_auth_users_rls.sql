-- Fix RLS policies for auth.users table
-- This script fixes the RLS policies to allow admin access to auth.users table

-- Step 1: Disable RLS temporarily on auth.users table
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on auth.users table
DROP POLICY IF EXISTS "users_select_own" ON auth.users;
DROP POLICY IF EXISTS "users_insert_own" ON auth.users;
DROP POLICY IF EXISTS "users_update_own" ON auth.users;
DROP POLICY IF EXISTS "users_delete_own" ON auth.users;
DROP POLICY IF EXISTS "users_select_all" ON auth.users;
DROP POLICY IF EXISTS "users_insert_all" ON auth.users;
DROP POLICY IF EXISTS "users_update_all" ON auth.users;
DROP POLICY IF EXISTS "users_delete_all" ON auth.users;

-- Step 3: Create simple policies that allow all operations on auth.users table
CREATE POLICY "users_select_all" ON auth.users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_all" ON auth.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_all" ON auth.users
  FOR UPDATE USING (true);

CREATE POLICY "users_delete_all" ON auth.users
  FOR DELETE USING (true);

-- Step 4: Re-enable RLS on auth.users table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Test that we can query auth.users table
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Step 6: Test that we can query profiles table
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as username_users FROM public.profiles WHERE username IS NOT NULL;
SELECT id, username, full_name, role FROM public.profiles WHERE username IS NOT NULL;
