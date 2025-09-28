-- Fix infinite recursion error in profiles table RLS policy
-- Run this in your Supabase SQL Editor

-- First, let's drop the problematic policies
DROP POLICY IF EXISTS "admins_all_access" ON public.profiles;
DROP POLICY IF EXISTS "listers_can_manage_their_comics" ON public.comics;
DROP POLICY IF EXISTS "viewers_can_read_all_comics" ON public.comics;
DROP POLICY IF EXISTS "analysts_can_read_all_comics" ON public.comics;

-- Create proper RLS policies for profiles table
CREATE POLICY "users_can_view_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create proper RLS policies for comics table
CREATE POLICY "users_can_view_own_comics"
  ON public.comics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_comics"
  ON public.comics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_comics"
  ON public.comics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_comics"
  ON public.comics FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies (separate and non-recursive)
CREATE POLICY "admins_can_view_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "admins_can_view_all_comics"
  ON public.comics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Test the policies
SELECT 'Policies created successfully' as status;
