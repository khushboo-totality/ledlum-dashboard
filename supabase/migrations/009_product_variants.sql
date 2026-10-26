-- ============================================================
-- Product variants (run once in the Supabase SQL editor).
--
-- The price lists repeat some models on several rows that differ in finish,
-- accessory, frame or type — each with its own price, e.g.
--   LLF-286  (no accessory)      White / Matt Black / Rose Gold   Rs.1690
--   LLF-286  Honeycomb Louvre    Black Chrome / Chrome / Bronze   Rs.1790
-- The bulk upload keeps every such row as a variant of the one product; the
-- partner's picks in the quote cart select the variant and so the price.
--
-- Stored on the private ledlum_product_prices table (service role only, never
-- visible to the public site), next to the model's normal prices:
--   variants = [ { "attributes": { "spec:Accessory": "Honeycomb Louvre",
--                                  "body_colors": "Black Chrome / Chrome / Bronze" },
--                  "prices": { "D.P.": "Rs.1790.00" } }, … ]
-- "attributes" holds only the columns that differ between the rows.
-- NULL = the model has a single row (no variants).
-- ============================================================
alter table public.ledlum_product_prices
  add column if not exists variants jsonb;
