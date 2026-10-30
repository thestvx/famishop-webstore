-- Add shipping weight/dimensions to products
alter table products add column if not exists weight_grams integer;
alter table products add column if not exists length_cm integer;
alter table products add column if not exists width_cm integer;
alter table products add column if not exists height_cm integer;
alter table products add column if not exists shipping_category text;
