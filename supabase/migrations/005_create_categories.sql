-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)
--
-- Moves product categories into their own table so they can be renamed in
-- one place. ledlum_products.category_id points at it; ledlum_products.group_name
-- is kept as a synced copy of the category name (by the triggers below) so
-- every existing filter/search/taxonomy query keeps working unchanged.

-- ── 1. Categories table ────────────────────────────────────────────────
create table public.ledlum_categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Case-insensitive uniqueness: "Bollards" and "BOLLARDS" are the same category.
create unique index ledlum_categories_name_key on public.ledlum_categories (lower(name));

alter table public.ledlum_categories enable row level security;
-- No policies: accessed only server-side via the service-role key.

-- ── 2. Seed from the existing free-text group_name values ──────────────
insert into public.ledlum_categories (name)
select distinct on (lower(trim(group_name))) trim(group_name)
from public.ledlum_products
where group_name is not null and trim(group_name) <> ''
order by lower(trim(group_name)), trim(group_name);

-- ── 3. Link products to categories ─────────────────────────────────────
-- restrict: a category that still has products can't be deleted.
alter table public.ledlum_products
  add column category_id bigint references public.ledlum_categories(id) on delete restrict;
create index idx_products_category_id on public.ledlum_products(category_id);

-- ── 4. Keep ledlum_products.group_name in sync ─────────────────────────
-- When a product's category_id is set/changed, copy the category's name.
create or replace function public.ledlum_sync_product_category_name()
returns trigger language plpgsql as $$
begin
  if new.category_id is not null
     and (tg_op = 'INSERT' or new.category_id is distinct from old.category_id) then
    select name into new.group_name from public.ledlum_categories where id = new.category_id;
  end if;
  return new;
end $$;

create trigger trg_products_sync_category_name
  before insert or update of category_id on public.ledlum_products
  for each row execute function public.ledlum_sync_product_category_name();

-- When a category is renamed, rename it on every product that uses it.
create or replace function public.ledlum_category_renamed()
returns trigger language plpgsql as $$
begin
  if new.name is distinct from old.name then
    update public.ledlum_products set group_name = new.name where category_id = new.id;
  end if;
  return new;
end $$;

create trigger trg_categories_renamed
  after update of name on public.ledlum_categories
  for each row execute function public.ledlum_category_renamed();

-- Backfill (fires the sync trigger, which also normalises case/spacing
-- variants like "Bollards " / "BOLLARDS" to the single category name).
update public.ledlum_products p
set category_id = c.id
from public.ledlum_categories c
where p.group_name is not null
  and lower(trim(p.group_name)) = lower(c.name);
