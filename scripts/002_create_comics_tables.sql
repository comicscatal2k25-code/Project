-- Create publishers table
create table if not exists public.publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create series table
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher_id uuid references public.publishers(id) on delete cascade,
  description text,
  start_year integer,
  end_year integer,
  status text default 'ongoing' check (status in ('ongoing', 'completed', 'cancelled', 'hiatus')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comics table (main catalog)
create table if not exists public.comics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid references public.series(id) on delete set null,
  publisher_id uuid references public.publishers(id) on delete set null,
  title text not null,
  issue_number text,
  variant text,
  publication_date date,
  cover_price decimal(10,2),
  condition text check (condition in ('mint', 'near_mint', 'very_fine', 'fine', 'very_good', 'good', 'fair', 'poor')),
  grade text,
  isbn text,
  upc text,
  diamond_code text,
  description text,
  notes text,
  cover_image_url text,
  page_count integer,
  creators jsonb, -- Store array of creators with roles
  tags text[], -- Array of tags
  location text, -- Physical storage location
  acquired_date date,
  acquired_price decimal(10,2),
  current_value decimal(10,2),
  for_sale boolean default false,
  sale_price decimal(10,2),
  shopify_product_id text,
  shopify_variant_id text,
  shopify_status text check (shopify_status in ('draft', 'active', 'archived')),
  last_shopify_sync timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.publishers enable row level security;
alter table public.series enable row level security;
alter table public.comics enable row level security;

-- RLS policies for publishers (read-only for users, full access for admins)
create policy "publishers_select_all"
  on public.publishers for select
  using (true);

create policy "publishers_admin_all"
  on public.publishers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS policies for series (read-only for users, full access for admins)
create policy "series_select_all"
  on public.series for select
  using (true);

create policy "series_admin_all"
  on public.series for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS policies for comics (users can only access their own)
create policy "comics_select_own"
  on public.comics for select
  using (auth.uid() = user_id);

create policy "comics_insert_own"
  on public.comics for insert
  with check (auth.uid() = user_id);

create policy "comics_update_own"
  on public.comics for update
  using (auth.uid() = user_id);

create policy "comics_delete_own"
  on public.comics for delete
  using (auth.uid() = user_id);

-- Admin can view all comics
create policy "comics_admin_select_all"
  on public.comics for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
