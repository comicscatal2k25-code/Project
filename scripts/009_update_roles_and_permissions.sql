-- Update roles to match requirements: Admin, Lister, Analyst, Viewer
-- Drop existing role constraint and recreate with new roles
alter table public.profiles drop constraint if exists profiles_role_check;

-- Add new role constraint with the four required roles
alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin', 'lister', 'analyst', 'viewer'));

-- Update existing 'user' roles to 'lister' (most appropriate default)
update public.profiles set role = 'lister' where role = 'user';

-- Create permissions table for fine-grained access control
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'lister', 'analyst', 'viewer')),
  resource text not null, -- e.g., 'comics', 'shopify', 'reports', 'settings'
  action text not null,   -- e.g., 'create', 'read', 'update', 'delete', 'publish'
  granted boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on permissions
alter table public.permissions enable row level security;

-- Only admins can view/modify permissions
create policy "permissions_admin_only"
  on public.permissions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insert default permissions based on requirements matrix
insert into public.permissions (role, resource, action, granted) values
-- Admin permissions (all access)
('admin', 'comics', 'create', true),
('admin', 'comics', 'read', true),
('admin', 'comics', 'update', true),
('admin', 'comics', 'delete', true),
('admin', 'shopify', 'create', true),
('admin', 'shopify', 'read', true),
('admin', 'shopify', 'update', true),
('admin', 'shopify', 'delete', true),
('admin', 'reports', 'create', true),
('admin', 'reports', 'read', true),
('admin', 'reports', 'update', true),
('admin', 'reports', 'delete', true),
('admin', 'settings', 'create', true),
('admin', 'settings', 'read', true),
('admin', 'settings', 'update', true),
('admin', 'settings', 'delete', true),

-- Lister permissions (add/edit comics, bulk operations, reports)
('lister', 'comics', 'create', true),
('lister', 'comics', 'read', true),
('lister', 'comics', 'update', true),
('lister', 'comics', 'delete', true),
('lister', 'shopify', 'create', true),
('lister', 'shopify', 'read', true),
('lister', 'shopify', 'update', true),
('lister', 'shopify', 'delete', true),
('lister', 'reports', 'create', true),
('lister', 'reports', 'read', true),
('lister', 'reports', 'update', true),
('lister', 'reports', 'delete', true),
('lister', 'settings', 'create', false),
('lister', 'settings', 'read', false),
('lister', 'settings', 'update', false),
('lister', 'settings', 'delete', false),

-- Analyst permissions (read-only access to comics, can run reports)
('analyst', 'comics', 'create', false),
('analyst', 'comics', 'read', true),
('analyst', 'comics', 'update', false),
('analyst', 'comics', 'delete', false),
('analyst', 'shopify', 'create', false),
('analyst', 'shopify', 'read', true),
('analyst', 'shopify', 'update', false),
('analyst', 'shopify', 'delete', false),
('analyst', 'reports', 'create', true),
('analyst', 'reports', 'read', true),
('analyst', 'reports', 'update', true),
('analyst', 'reports', 'delete', true),
('analyst', 'settings', 'create', false),
('analyst', 'settings', 'read', false),
('analyst', 'settings', 'update', false),
('analyst', 'settings', 'delete', false),

-- Viewer permissions (read-only access to comics only)
('viewer', 'comics', 'create', false),
('viewer', 'comics', 'read', true),
('viewer', 'comics', 'update', false),
('viewer', 'comics', 'delete', false),
('viewer', 'shopify', 'create', false),
('viewer', 'shopify', 'read', false),
('viewer', 'shopify', 'update', false),
('viewer', 'shopify', 'delete', false),
('viewer', 'reports', 'create', false),
('viewer', 'reports', 'read', false),
('viewer', 'reports', 'update', false),
('viewer', 'reports', 'delete', false),
('viewer', 'settings', 'create', false),
('viewer', 'settings', 'read', false),
('viewer', 'settings', 'update', false),
('viewer', 'settings', 'delete', false);

-- Create function to check user permissions
create or replace function public.user_has_permission(
  user_id uuid,
  resource_name text,
  action_name text
)
returns boolean
language plpgsql
security definer
as $$
declare
  user_role text;
begin
  -- Get user role
  select role into user_role
  from public.profiles
  where id = user_id;
  
  -- Check if permission exists and is granted
  return exists (
    select 1 from public.permissions
    where role = user_role
      and resource = resource_name
      and action = action_name
      and granted = true
  );
end;
$$;

-- Create function to get user role
create or replace function public.get_user_role(user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  user_role text;
begin
  select role into user_role
  from public.profiles
  where id = user_id;
  
  return coalesce(user_role, 'viewer');
end;
$$;
