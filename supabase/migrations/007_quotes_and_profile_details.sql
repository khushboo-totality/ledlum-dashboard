-- Run this in the Supabase SQL Editor (after 004).
--
-- 1. ledlum_quotes — every quote request a partner sends, stored in full so
--    they can see it again in My Account (quote history, copy to cart,
--    re-download the BOQ).
-- 2. Partner profile details: phone, GST number, billing address.

-- ── 1. Quotes ──────────────────────────────────────────────────────────
create table public.ledlum_quotes (
  id              bigint generated always as identity primary key,
  -- Kept (set null) if the account is deleted; name/company/email snapshotted.
  user_id         uuid references auth.users(id) on delete set null,
  username        text not null,
  partner_name    text not null,
  company         text,
  partner_email   text not null,
  status          text not null default 'sent',   -- sent (more statuses later: reviewed, quoted, ordered…)
  note            text,
  -- Project details (from the BOQ details form)
  project_name    text,
  location        text,
  architect_name  text,
  architect_pan   text,
  -- Line items: [{ productCode, productName, productImage, context, quantity,
  --   selection, unitPrice, discount, productSpecs }]
  items           jsonb not null,
  item_count      int  not null,
  total_qty       int  not null,
  subtotal        numeric(14, 2),   -- Σ D.P. × qty (priced items only)
  discount        numeric(14, 2),   -- Σ discount amount
  total           numeric(14, 2),   -- subtotal − discount, excl. GST
  email_sent      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_quotes_user on public.ledlum_quotes(user_id, created_at desc);
create index idx_quotes_username on public.ledlum_quotes(username, created_at desc);

alter table public.ledlum_quotes enable row level security;
-- No policies: read/written only server-side via the service-role key.

-- ── 2. Profile details ─────────────────────────────────────────────────
alter table public.ledlum_profiles
  add column phone            text,
  add column gst_number       text,
  add column billing_address  text;

-- Signed-in users may read these on their own profile (see 004's column grant).
grant select (phone, gst_number, billing_address) on public.ledlum_profiles to authenticated;
