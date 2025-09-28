-- Create indexes for better performance
create index if not exists idx_comics_user_id on public.comics(user_id);
create index if not exists idx_comics_series_id on public.comics(series_id);
create index if not exists idx_comics_publisher_id on public.comics(publisher_id);
create index if not exists idx_comics_title on public.comics(title);
create index if not exists idx_comics_issue_number on public.comics(issue_number);
create index if not exists idx_comics_for_sale on public.comics(for_sale);
create index if not exists idx_comics_shopify_product_id on public.comics(shopify_product_id);
create index if not exists idx_comics_tags on public.comics using gin(tags);
create index if not exists idx_comics_creators on public.comics using gin(creators);

create index if not exists idx_series_publisher_id on public.series(publisher_id);
create index if not exists idx_series_title on public.series(title);

create index if not exists idx_shopify_sync_logs_user_id on public.shopify_sync_logs(user_id);
create index if not exists idx_shopify_sync_logs_comic_id on public.shopify_sync_logs(comic_id);
create index if not exists idx_shopify_sync_logs_status on public.shopify_sync_logs(status);

create index if not exists idx_job_queue_user_id on public.job_queue(user_id);
create index if not exists idx_job_queue_status on public.job_queue(status);
create index if not exists idx_job_queue_scheduled_at on public.job_queue(scheduled_at);

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_publishers_updated_at
  before update on public.publishers
  for each row execute function public.update_updated_at_column();

create trigger update_series_updated_at
  before update on public.series
  for each row execute function public.update_updated_at_column();

create trigger update_comics_updated_at
  before update on public.comics
  for each row execute function public.update_updated_at_column();

create trigger update_shopify_settings_updated_at
  before update on public.shopify_settings
  for each row execute function public.update_updated_at_column();

create trigger update_listing_templates_updated_at
  before update on public.listing_templates
  for each row execute function public.update_updated_at_column();

create trigger update_job_queue_updated_at
  before update on public.job_queue
  for each row execute function public.update_updated_at_column();

create trigger update_import_sessions_updated_at
  before update on public.import_sessions
  for each row execute function public.update_updated_at_column();
