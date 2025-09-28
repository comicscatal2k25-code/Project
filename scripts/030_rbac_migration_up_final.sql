-- RBAC Migration: Upgrade to full role-based access control (FINAL VERSION)
-- This migration adds the new RBAC system while preserving existing data
-- Handles RLS policies that depend on the role column

-- Step 1: Drop all RLS policies that depend on the role column
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;

-- Step 2: Check current role column type and handle accordingly
DO $$
DECLARE
    role_column_type text;
BEGIN
    -- Get the data type of the role column
    SELECT data_type INTO role_column_type
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND table_schema = 'public';
    
    -- If it's an enum, we need to handle it differently
    IF role_column_type = 'USER-DEFINED' THEN
        -- Check if it's actually an enum by looking at the type name
        SELECT udt_name INTO role_column_type
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public';
        
        -- If it's an enum, we need to drop the constraint and alter the column
        IF role_column_type LIKE '%enum%' OR role_column_type LIKE '%user_role%' THEN
            -- Drop the check constraint first
            ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
            
            -- Alter the column to text type
            ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
            
            -- Now we can proceed with the migration
        END IF;
    END IF;
END $$;

-- Step 3: Update the profiles table to support the new role system
-- First, add the new role column with default 'viewer' for existing users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS new_role text DEFAULT 'viewer' 
CHECK (new_role IN ('admin', 'lister', 'analyst', 'viewer'));

-- Migrate existing roles to new system
-- Map 'admin' -> 'admin', 'user' -> 'lister' (since 'user' was the default for new signups)
UPDATE public.profiles 
SET new_role = CASE 
  WHEN role = 'admin' THEN 'admin'
  WHEN role = 'user' THEN 'lister'
  ELSE 'viewer'
END
WHERE new_role = 'viewer';

-- Drop the old role column and rename new_role to role
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles RENAME COLUMN new_role TO role;

-- Step 4: Create the permissions table for fine-grained access control
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

-- Step 5: Create audit_logs table for RBAC event tracking
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

-- Step 6: Insert the RBAC permission matrix
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

-- Step 7: Update the handle_new_user function to use the new role system
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

-- Step 8: Recreate RLS policies for profiles table with new role system
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

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_role_resource_action ON public.permissions(role, resource, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource ON public.audit_logs(action, resource);

-- Step 10: Create function to log audit events
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

-- Step 11: Create a function to check if RBAC is enabled
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

-- Step 12: Verify the migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_permissions FROM public.permissions;
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role;
