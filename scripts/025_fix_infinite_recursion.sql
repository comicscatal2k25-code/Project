-- Fix infinite recursion in profiles table RLS policies
-- This script removes problematic policies and creates simpler ones

-- First, disable RLS temporarily to avoid issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_delete_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_can_view_other_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_their_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_their_own_profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own profile
CREATE POLICY "users_view_own_profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 3: Users can insert their own profile (for new user creation)
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy 4: Allow all authenticated users to view profiles (for role checking)
-- This is needed for the role system to work
CREATE POLICY "authenticated_view_profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 5: Only allow users to delete their own profile
CREATE POLICY "users_delete_own_profile"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- Update the handle_new_user function to be simpler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'lister' -- Default new users to 'lister' role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Test the policies by checking if we can query profiles
-- This should work without infinite recursion
SELECT COUNT(*) as profile_count FROM public.profiles;
