-- Run this in the Supabase SQL Editor after 003_create_profiles.sql.
--
-- 1. Password + invite tracking on profiles
-- 2. Activity log (full history of partner accounts and what they do)

-- ── 1. Profile columns ─────────────────────────────────────────────────
-- password_hash: scrypt hash of the account's current password, kept in sync
-- by the app whenever a password is set/changed. Never the plain password —
-- Supabase Auth also keeps its own hash in auth.users.
alter table public.ledlum_profiles
  add column password_hash         text,
  add column must_change_password  boolean     not null default false,
  add column invited_at            timestamptz,
  add column password_changed_at   timestamptz,
  add column last_login_at         timestamptz,
  add column created_by            text;        -- username of the admin who created the account

-- Browser users may read their own profile, but never the password hash:
-- replace the table-wide SELECT grant with a column list.
revoke select on public.ledlum_profiles from anon, authenticated;
grant select (id, username, email, role, name, company, initials, created_at,
              must_change_password, invited_at, password_changed_at, last_login_at)
  on public.ledlum_profiles to authenticated;

-- ── 2. Activity log ────────────────────────────────────────────────────
create table public.ledlum_activity_log (
  id          bigint generated always as identity primary key,
  -- Kept (set null) after the account is deleted, so history survives;
  -- username/role are snapshotted for the same reason.
  user_id     uuid references auth.users(id) on delete set null,
  username    text not null,
  role        text,
  event       text not null,          -- e.g. 'account_created', 'login', 'quote_sent'
  details     jsonb not null default '{}'::jsonb,
  actor       text,                   -- who performed it (admin username, or the user themself)
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_activity_username on public.ledlum_activity_log(username, created_at desc);
create index idx_activity_user     on public.ledlum_activity_log(user_id, created_at desc);
create index idx_activity_event    on public.ledlum_activity_log(event);

alter table public.ledlum_activity_log enable row level security;
-- No policies: read/written only server-side via the service-role key.
