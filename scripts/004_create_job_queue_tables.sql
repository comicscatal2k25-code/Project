-- Create job_queue table for background processing
create table if not exists public.job_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('shopify_sync', 'bulk_import', 'bulk_export', 'image_processing', 'data_cleanup')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority integer default 0,
  payload jsonb not null,
  result jsonb,
  error_message text,
  attempts integer default 0,
  max_attempts integer default 3,
  scheduled_at timestamp with time zone default timezone('utc'::text, now()),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create import_sessions table for tracking bulk imports
create table if not exists public.import_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  file_size integer,
  total_records integer,
  processed_records integer default 0,
  successful_records integer default 0,
  failed_records integer default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_log jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_queue enable row level security;
alter table public.import_sessions enable row level security;

-- RLS policies for job_queue
create policy "job_queue_select_own"
  on public.job_queue for select
  using (auth.uid() = user_id);

create policy "job_queue_insert_own"
  on public.job_queue for insert
  with check (auth.uid() = user_id);

create policy "job_queue_update_own"
  on public.job_queue for update
  using (auth.uid() = user_id);

-- RLS policies for import_sessions
create policy "import_sessions_select_own"
  on public.import_sessions for select
  using (auth.uid() = user_id);

create policy "import_sessions_insert_own"
  on public.import_sessions for insert
  with check (auth.uid() = user_id);

create policy "import_sessions_update_own"
  on public.import_sessions for update
  using (auth.uid() = user_id);
