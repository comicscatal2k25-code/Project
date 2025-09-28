-- Enhanced Comics Schema with Comic-Specific Metadata
-- This script creates comprehensive tables for comic catalog management

-- Create comics table with all required fields
create table if not exists public.comics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Basic Product Information
  title text not null,
  handle text not null, -- URL slug
  description text,
  body_html text, -- Rich text description
  
  -- Comic-Specific Fields
  issue_number text,
  printing_suffix text, -- e.g., "2nd", "Variant", "Cover A"
  era text, -- e.g., "Golden Age", "Silver Age", "Modern"
  publisher text,
  series text,
  volume text,
  
  -- Release Information
  release_date date,
  cover_date date,
  
  -- Physical Attributes
  condition text check (condition in ('Mint', 'Near Mint', 'Very Fine', 'Fine', 'Very Good', 'Good', 'Fair', 'Poor')),
  grade text, -- e.g., "9.8", "9.6", "9.4"
  grading_service text, -- e.g., "CGC", "PGX", "CBCS"
  slab_id text, -- Slab certification number
  is_slabbed boolean default false,
  
  -- Key Issue Information
  is_key_issue boolean default false,
  key_issue_notes text,
  
  -- Additional Metadata
  print_run text,
  lot_number text,
  restoration_notes text,
  internal_notes text,
  external_source_id text, -- For duplicate detection
  
  -- Shopify Integration
  shopify_product_id text,
  shopify_variant_id text,
  published_to_shopify boolean default false,
  last_synced_at timestamp with time zone,
  
  -- System Fields
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(user_id, handle),
  unique(user_id, external_source_id)
);

-- Create variants table for different versions/conditions of the same comic
create table if not exists public.comic_variants (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  
  -- Variant Information
  variant_name text not null, -- e.g., "Cover A", "Variant", "2nd Printing"
  sku text not null,
  
  -- Pricing
  price decimal(10,2),
  compare_at_price decimal(10,2),
  
  -- Inventory
  inventory_quantity integer default 0,
  track_inventory boolean default true,
  
  -- Physical Attributes (can override comic defaults)
  condition text check (condition in ('Mint', 'Near Mint', 'Very Fine', 'Fine', 'Very Good', 'Good', 'Fair', 'Poor')),
  grade text,
  grading_service text,
  slab_id text,
  is_slabbed boolean default false,
  
  -- Additional Fields
  barcode text,
  weight decimal(8,2), -- in grams
  dimensions text, -- e.g., "6.625 x 10.25 inches"
  
  -- Shopify Integration
  shopify_variant_id text,
  published_to_shopify boolean default false,
  
  -- System Fields
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(comic_id, sku)
);

-- Create creators table for comic creators
create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null, -- e.g., "Writer", "Artist", "Colorist", "Letterer", "Editor"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(name, role)
);

-- Create comic_creators junction table
create table if not exists public.comic_creators (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(comic_id, creator_id)
);

-- Create images table for comic images
create table if not exists public.comic_images (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  variant_id uuid references public.comic_variants(id) on delete cascade,
  
  -- Image Information
  url text not null,
  alt_text text,
  file_name text,
  file_size integer, -- in bytes
  mime_type text,
  width integer,
  height integer,
  checksum text, -- for deduplication
  
  -- Image Type
  image_type text not null check (image_type in ('cover', 'interior', 'variant', 'slab', 'other')),
  is_primary boolean default false,
  
  -- Shopify Integration
  shopify_image_id text,
  published_to_shopify boolean default false,
  
  -- System Fields
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tags table for comic categorization
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text, -- hex color for UI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comic_tags junction table
create table if not exists public.comic_tags (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(comic_id, tag_id)
);

-- Create collections table for grouping comics
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  handle text not null,
  
  -- Shopify Integration
  shopify_collection_id text,
  published_to_shopify boolean default false,
  
  -- System Fields
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(user_id, handle)
);

-- Create collection_comics junction table
create table if not exists public.collection_comics (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  comic_id uuid not null references public.comics(id) on delete cascade,
  position integer, -- for ordering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  unique(collection_id, comic_id)
);

-- Enable RLS on all tables
alter table public.comics enable row level security;
alter table public.comic_variants enable row level security;
alter table public.creators enable row level security;
alter table public.comic_creators enable row level security;
alter table public.comic_images enable row level security;
alter table public.tags enable row level security;
alter table public.comic_tags enable row level security;
alter table public.collections enable row level security;
alter table public.collection_comics enable row level security;

-- RLS Policies for comics
create policy "comics_select_own"
  on public.comics for select
  using (user_id = auth.uid());

create policy "comics_insert_own"
  on public.comics for insert
  with check (user_id = auth.uid());

create policy "comics_update_own"
  on public.comics for update
  using (user_id = auth.uid());

create policy "comics_delete_own"
  on public.comics for delete
  using (user_id = auth.uid());

-- Admin can view all comics
create policy "comics_admin_select_all"
  on public.comics for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Similar policies for other tables...
-- (comic_variants, comic_images, collections, etc.)

-- Create indexes for performance
create index if not exists idx_comics_user_id on public.comics(user_id);
create index if not exists idx_comics_title on public.comics(title);
create index if not exists idx_comics_publisher on public.comics(publisher);
create index if not exists idx_comics_era on public.comics(era);
create index if not exists idx_comics_condition on public.comics(condition);
create index if not exists idx_comics_is_key_issue on public.comics(is_key_issue);
create index if not exists idx_comics_published_to_shopify on public.comics(published_to_shopify);

create index if not exists idx_comic_variants_comic_id on public.comic_variants(comic_id);
create index if not exists idx_comic_variants_sku on public.comic_variants(sku);

create index if not exists idx_comic_images_comic_id on public.comic_images(comic_id);
create index if not exists idx_comic_images_variant_id on public.comic_images(variant_id);
create index if not exists idx_comic_images_is_primary on public.comic_images(is_primary);

create index if not exists idx_collections_user_id on public.collections(user_id);

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add updated_at triggers
create trigger update_comics_updated_at
  before update on public.comics
  for each row
  execute function public.update_updated_at_column();

create trigger update_comic_variants_updated_at
  before update on public.comic_variants
  for each row
  execute function public.update_updated_at_column();

create trigger update_comic_images_updated_at
  before update on public.comic_images
  for each row
  execute function public.update_updated_at_column();

create trigger update_collections_updated_at
  before update on public.collections
  for each row
  execute function public.update_updated_at_column();
