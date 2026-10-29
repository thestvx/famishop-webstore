-- Run in Supabase SQL editor to support the redesigned product listing fields.
alter table products add column if not exists title_translations jsonb default '{}'::jsonb;
alter table products add column if not exists description text;
alter table products add column if not exists description_translations jsonb default '{}'::jsonb;
alter table products add column if not exists category text;
alter table products add column if not exists category_path text;
alter table products add column if not exists brand text;
alter table products add column if not exists size text;
alter table products add column if not exists condition text;
alter table products add column if not exists colors text[] default '{}';
alter table products add column if not exists materials text[] default '{}';
alter table products add column if not exists price numeric;
alter table products add column if not exists prices jsonb default '{}'::jsonb;
alter table products add column if not exists package_size text;
alter table products add column if not exists status text default 'published';
alter table products add column if not exists public_ids text[] default '{}';
