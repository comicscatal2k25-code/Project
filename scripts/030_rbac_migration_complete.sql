-- RBAC Migration: Complete version that handles ALL RLS policy dependencies
-- This migration removes all policies from ALL tables before altering the role column

-- Step 1: Disable RLS on all tables that might have policies depending on role
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comics DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies from ALL tables that might reference role
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop policies from profiles table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop policies from comics table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'comics' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.comics';
    END LOOP;
    
    -- Drop policies from any other tables that might reference role
    FOR pol IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND policyname LIKE '%role%' OR policyname LIKE '%admin%' OR policyname LIKE '%lister%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || pol.tablename;
    END LOOP;
END $$;

-- Step 3: Now we can safely alter the role column
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ALTER COLUMN role TYPE text;

-- Step 4: Add the new role column with default 'viewer' for existing users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS new_role text DEFAULT 'viewer' 
CHECK (new_role IN ('admin', 'lister', 'analyst', 'viewer'));

-- Step 5: Migrate existing roles to new system
UPDATE public.profiles 
SET new_role = CASE 
  WHEN role = 'admin' THEN 'admin'
  WHEN role = 'user' THEN 'lister'
  ELSE 'viewer'
END
WHERE new_role = 'viewer';

-- Step 6: Drop the old role column and rename new_role to role
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles RENAME COLUMN new_role TO role;

-- Step 7: Create the permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'lister', 'analyst', 'viewer')),
  resource text NOT NULL,
  action text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(role, resource, action)
);

-- Enable RLS on permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions (only admins can manage permissions)
CREATE POLICY "permissions_admin_all" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 8: Create audit_logs table for RBAC event tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (admins can view all, users can view their own)
CREATE POLICY "audit_logs_admin_all" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "audit_logs_user_own" ON public.audit_logs
  FOR SELECT USING (
    actor_user_id = auth.uid() OR target_user_id = auth.uid()
  );

-- Step 9: Insert the RBAC permission matrix
-- Admin: Full access to everything
INSERT INTO public.permissions (role, resource, action, granted) VALUES
-- Comics management
('admin', 'comics', 'create', true),
('admin', 'comics', 'read', true),
('admin', 'comics', 'update', true),
('admin', 'comics', 'delete', true),
-- Import/Export
('admin', 'import', 'create', true),
('admin', 'export', 'create', true),
-- Reports
('admin', 'reports', 'read', true),
('admin', 'reports', 'create', true),
-- Settings
('admin', 'settings', 'read', true),
('admin', 'settings', 'update', true),
-- User management
('admin', 'users', 'create', true),
('admin', 'users', 'read', true),
('admin', 'users', 'update', true),
('admin', 'users', 'delete', true),
-- Shopify
('admin', 'shopify', 'create', true),
('admin', 'shopify', 'read', true),
('admin', 'shopify', 'update', true),
('admin', 'shopify', 'delete', true)
ON CONFLICT (role, resource, action) DO UPDATE SET granted = EXCLUDED.granted;

-- Lister: Can add/edit comics and manage Shopify listings
INSERT INTO public.permissions (role, resource, action, granted) VALUES
-- Comics management
('lister', 'comics', 'create', true),
('lister', 'comics', 'read', true),
('lister', 'comics', 'update', true),
('lister', 'comics', 'delete', true),
-- Import/Export
('lister', 'import', 'create', true),
('lister', 'export', 'create', true),
-- Reports
('lister', 'reports', 'read', true),
('lister', 'reports', 'create', true),
-- Settings (read-only)
('lister', 'settings', 'read', true),
-- Shopify
('lister', 'shopify', 'create', true),
('lister', 'shopify', 'read', true),
('lister', 'shopify', 'update', true),
('lister', 'shopify', 'delete', true)
ON CONFLICT (role, resource, action) DO UPDATE SET granted = EXCLUDED.granted;

-- Analyst: Can view comics and run reports
INSERT INTO public.permissions (role, resource, action, granted) VALUES
-- Comics management (read-only)
('analyst', 'comics', 'read', true),
-- Reports
('analyst', 'reports', 'read', true),
('analyst', 'reports', 'create', true),
-- Settings (read-only)
('analyst', 'settings', 'read', true)
ON CONFLICT (role, resource, action) DO UPDATE SET granted = EXCLUDED.granted;

-- Viewer: Read-only access to comics catalog
INSERT INTO public.permissions (role, resource, action, granted) VALUES
-- Comics management (read-only)
('viewer', 'comics', 'read', true),
-- Settings (read-only)
('viewer', 'settings', 'read', true)
ON CONFLICT (role, resource, action) DO UPDATE SET granted = EXCLUDED.granted;

-- Step 10: Update the handle_new_user function to use the new role system
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
    'viewer' -- Default new users to 'viewer' role (most restrictive)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Step 11: Re-enable RLS and recreate policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can manage their own profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 12: Re-enable RLS and recreate policies for comics table
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

-- Basic comics policies (users can manage their own comics)
CREATE POLICY "comics_select_own" ON public.comics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comics_insert_own" ON public.comics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comics_update_own" ON public.comics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comics_delete_own" ON public.comics
  FOR DELETE USING (auth.uid() = user_id);

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_role_resource_action ON public.permissions(role, resource, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource ON public.audit_logs(action, resource);

-- Step 14: Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_user_id uuid,
  p_target_user_id uuid DEFAULT NULL,
  p_action text,
  p_resource text,
  p_outcome text,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_user_id,
    target_user_id,
    action,
    resource,
    outcome,
    ip,
    user_agent,
    metadata
  ) VALUES (
    p_actor_user_id,
    p_target_user_id,
    p_action,
    p_resource,
    p_outcome,
    p_ip,
    p_user_agent,
    p_metadata
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.permissions TO anon, authenticated;
GRANT ALL ON public.audit_logs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO anon, authenticated;

-- Step 15: Create a function to check if RBAC is enabled
CREATE OR REPLACE FUNCTION public.is_rbac_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the permissions table exists and has data
  RETURN EXISTS (
    SELECT 1 FROM public.permissions LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_rbac_enabled TO anon, authenticated;

-- Step 16: Verify the migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_permissions FROM public.permissions;
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role;
