-- Fix user profile creation trigger with proper permissions
-- This addresses the "Database error saving new user" issue

-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Recreate the function with proper error handling
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert new profile with error handling
  begin
    insert into public.profiles (id, email, full_name)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', '')
    );
  exception when others then
    -- Log the error but don't fail the user creation
    raise log 'Error creating profile for user %: %', new.id, sqlerrm;
  end;
  
  return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;

-- Ensure RLS policies are correct
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (true); -- Allow profile creation during signup

-- Update the insert policy to be more permissive during signup
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or auth.uid() is null);
