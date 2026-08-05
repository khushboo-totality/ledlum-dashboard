-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)

create table public.ledlum_zone (
  id          bigint generated always as identity primary key,
  slug        text not null unique,        -- e.g. 'zone-a' — matches the app's zone id
  label       text not null,               -- e.g. 'Zone A'
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table public.ledlum_product_zone (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.ledlum_products(id) on delete cascade,
  zone_id     bigint not null references public.ledlum_zone(id)     on delete cascade,
  created_at  timestamptz not null default now(),
  unique (product_id, zone_id)
);

create index idx_product_zone_product on public.ledlum_product_zone(product_id);
create index idx_product_zone_zone    on public.ledlum_product_zone(zone_id);

insert into public.ledlum_zone (slug, label, sort_order) values
  ('zone-a','Zone A',1), ('zone-b','Zone B',2), ('zone-c','Zone C',3),
  ('zone-d','Zone D',4), ('zone-e','Zone E',5), ('zone-g','Zone G',6),
  ('eb-room','EB Room',7), ('astara-lounge','Astara Lounge',8),
  ('artizan','Artizan',9), ('conference','Conference',10),
  ('sumeet','Sumeet',11), ('abheek','Abheek',12), ('pooja','Pooja',13),
  ('podcast','Podcast',14), ('abhav','Abhav',15);

alter table public.ledlum_zone enable row level security;
alter table public.ledlum_product_zone enable row level security;
-- No policies added: the app only ever accesses these tables server-side
-- via the Supabase service-role key, which bypasses RLS entirely.
