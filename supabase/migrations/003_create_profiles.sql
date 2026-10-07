-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)
--
-- App-level profile for every Supabase Auth user (staff + partners).
-- Login itself is handled by Supabase Auth (auth.users); this table holds
-- the role and display info the dashboard needs.

create table public.ledlum_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,         -- lowercase, used to sign in
  email       text not null,
  role        text not null check (role in ('admin', 'editor', 'viewer', 'partner')),
  name        text not null,
  company     text,
  initials    text not null,
  created_at  timestamptz not null default now()
);

create index idx_profiles_role on public.ledlum_profiles(role);

alter table public.ledlum_profiles enable row level security;

-- Signed-in users may read their own profile (the browser loads it after
-- login). All writes — and reading other users' profiles — go through the
-- app's API routes with the service-role key, which bypasses RLS.
create policy "Users can read own profile"
  on public.ledlum_profiles for select
  to authenticated
  using (auth.uid() = id);
