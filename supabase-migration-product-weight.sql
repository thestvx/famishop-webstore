-- Add product weight support (run once in Supabase SQL editor)
alter table products add column if not exists weight_grams integer;
alter table products add column if not exists weight_kg numeric;
