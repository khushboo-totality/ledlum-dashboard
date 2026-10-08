-- Run this in the Supabase SQL Editor after 005_create_categories.sql.
--
-- Each category belongs to one main category (ledlum_products.collection:
-- indoor / outdoor / artizan / volaris / klewe …). Store it on the category
-- so the Add Product flow can go  main category -> category -> details,
-- and keep products' collection in sync with their category's.

alter table public.ledlum_categories add column collection text;
create index idx_categories_collection on public.ledlum_categories(collection);

-- Backfill: the main category most of the category's products are in
-- (today every category maps to exactly one).
update public.ledlum_categories c
set collection = sub.collection
from (
  select distinct on (category_id) category_id, collection
  from public.ledlum_products
  where category_id is not null and collection is not null and collection <> ''
  group by category_id, collection
  order by category_id, count(*) desc
) sub
where sub.category_id = c.id;

-- Product gets (or changes) its category -> copy the category's name and,
-- when the category has one, its main category.
create or replace function public.ledlum_sync_product_category_name()
returns trigger language plpgsql as $$
declare
  cat_name text;
  cat_collection text;
begin
  if new.category_id is not null
     and (tg_op = 'INSERT' or new.category_id is distinct from old.category_id) then
    select name, collection into cat_name, cat_collection
    from public.ledlum_categories where id = new.category_id;
    new.group_name := cat_name;
    if cat_collection is not null then
      new.collection := cat_collection;
    end if;
  end if;
  return new;
end $$;

-- Category renamed or moved to another main category -> update its products.
create or replace function public.ledlum_category_renamed()
returns trigger language plpgsql as $$
begin
  if new.name is distinct from old.name then
    update public.ledlum_products set group_name = new.name where category_id = new.id;
  end if;
  if new.collection is distinct from old.collection and new.collection is not null then
    update public.ledlum_products set collection = new.collection where category_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_categories_renamed on public.ledlum_categories;
create trigger trg_categories_renamed
  after update of name, collection on public.ledlum_categories
  for each row execute function public.ledlum_category_renamed();
