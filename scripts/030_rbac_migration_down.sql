-- RBAC Migration Rollback: Revert to basic role system
-- This migration removes the RBAC system and restores the original role structure

-- Step 1: Drop RBAC-specific functions
DROP FUNCTION IF EXISTS public.log_audit_event;
DROP FUNCTION IF EXISTS public.is_rbac_enabled;

-- Step 2: Drop RBAC tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;

-- Step 3: Restore the original role system
-- Add back the original role column with 'user' as default
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS old_role text DEFAULT 'user' 
CHECK (old_role IN ('admin', 'user'));

-- Migrate roles back to original system
-- Map 'admin' -> 'admin', everything else -> 'user'
UPDATE public.profiles 
SET old_role = CASE 
  WHEN role = 'admin' THEN 'admin'
  ELSE 'user'
END
WHERE old_role = 'user';

-- Drop the RBAC role column and rename old_role back to role
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles RENAME COLUMN old_role TO role;

-- Step 4: Restore the original handle_new_user function
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
    'user' -- Default new users to 'user' role (original behavior)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Step 5: Update RLS policies to match original system
-- Drop RBAC-specific policies
DROP POLICY IF EXISTS "permissions_admin_all" ON public.permissions;
DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_user_own" ON public.audit_logs;

-- Restore original profiles policies (these should already exist)
-- Admin can view all profiles
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can manage their own profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Note: This rollback preserves user data but removes the RBAC permission system
-- Users will revert to the original 'admin' or 'user' roles
