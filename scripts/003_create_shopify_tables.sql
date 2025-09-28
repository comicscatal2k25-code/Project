-- Create shopify_settings table for API configuration
create table if not exists public.shopify_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_domain text not null,
  access_token text not null,
  webhook_secret text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id) -- One Shopify connection per user
);

-- Create shopify_sync_logs table for tracking sync operations
create table if not exists public.shopify_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('create', 'update', 'delete', 'bulk_import', 'bulk_export')),
  comic_id uuid references public.comics(id) on delete set null,
  shopify_product_id text,
  status text not null check (status in ('pending', 'success', 'error')),
  error_message text,
  sync_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create listing_templates table for Shopify listing templates
create table if not exists public.listing_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title_template text not null,
  description_template text not null,
  tags_template text[],
  product_type text,
  vendor text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.shopify_settings enable row level security;
alter table public.shopify_sync_logs enable row level security;
alter table public.listing_templates enable row level security;

-- RLS policies for shopify_settings
create policy "shopify_settings_select_own"
  on public.shopify_settings for select
  using (auth.uid() = user_id);

create policy "shopify_settings_insert_own"
  on public.shopify_settings for insert
  with check (auth.uid() = user_id);

create policy "shopify_settings_update_own"
  on public.shopify_settings for update
  using (auth.uid() = user_id);

create policy "shopify_settings_delete_own"
  on public.shopify_settings for delete
  using (auth.uid() = user_id);

-- RLS policies for shopify_sync_logs
create policy "shopify_sync_logs_select_own"
  on public.shopify_sync_logs for select
  using (auth.uid() = user_id);

create policy "shopify_sync_logs_insert_own"
  on public.shopify_sync_logs for insert
  with check (auth.uid() = user_id);

-- RLS policies for listing_templates
create policy "listing_templates_select_own"
  on public.listing_templates for select
  using (auth.uid() = user_id);

create policy "listing_templates_insert_own"
  on public.listing_templates for insert
  with check (auth.uid() = user_id);

create policy "listing_templates_update_own"
  on public.listing_templates for update
  using (auth.uid() = user_id);

create policy "listing_templates_delete_own"
  on public.listing_templates for delete
  using (auth.uid() = user_id);
