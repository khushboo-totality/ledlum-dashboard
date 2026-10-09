-- Run this in the Supabase SQL Editor.
--
-- App-wide settings editable by admins (Admin → Settings), as key/value JSON.
-- First setting: who receives partner quote requests.

create table public.ledlum_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text                      -- admin username
);

alter table public.ledlum_settings enable row level security;
-- No policies: read/written only server-side via the service-role key.

insert into public.ledlum_settings (key, value, updated_by)
values ('quote_recipients', '["projects@ledlumlighting.com"]'::jsonb, 'migration')
on conflict (key) do nothing;
