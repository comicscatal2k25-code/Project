-- Temporarily disable RLS on profiles table to fix infinite recursion
-- This allows the edit functionality to work while we fix the role system

-- Disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_delete_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_can_view_other_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_delete_own_profile" ON public.profiles;

-- Test that we can now query profiles without recursion
SELECT COUNT(*) as profile_count FROM public.profiles;
SELECT id, email, role FROM public.profiles LIMIT 5;
