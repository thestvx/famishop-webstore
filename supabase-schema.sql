-- Run this in Supabase SQL editor to create FamiShop tables

create table if not exists products (
  id bigint primary key generated always as identity,
  title text not null,
  src_url text,
  price numeric not null,
  rating numeric default 0,
  discount jsonb default '{"amount":0,"percentage":0}'::jsonb,
  gallery text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists orders (
  id bigint primary key generated always as identity,
  customer text,
  total numeric,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists customers (
  id bigint primary key generated always as identity,
  name text,
  email text,
  created_at timestamptz default now()
);

-- Enable RLS (optional, configure policies as needed)
alter table products enable row level security;
alter table orders enable row level security;
alter table customers enable row level security;

-- Public read for products
create policy "products are viewable by everyone"
  on products for select using (true);
