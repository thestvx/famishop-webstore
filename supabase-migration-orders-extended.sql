-- Run in Supabase SQL editor to support FamiShop checkout orders.
-- Safe to run on an existing orders table: missing columns are added.

create table if not exists orders (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb default '{}'::jsonb,
  shipping_method text,
  shipping_fee numeric default 0,
  currency text default 'EUR',
  subtotal numeric default 0,
  discount numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  status text default 'pending',
  payment_status text default 'pending',
  payment_method text default 'cash_on_delivery',
  payment_reference text,
  items jsonb default '[]'::jsonb,
  notes text,
  customer text,
  idempotency_key text
);

alter table orders add column if not exists created_at timestamptz default now();
alter table orders add column if not exists customer_name text;
alter table orders add column if not exists customer_email text;
alter table orders add column if not exists customer_phone text;
alter table orders add column if not exists shipping_address jsonb default '{}'::jsonb;
alter table orders add column if not exists shipping_method text;
alter table orders add column if not exists shipping_fee numeric default 0;
alter table orders add column if not exists currency text default 'EUR';
alter table orders add column if not exists subtotal numeric default 0;
alter table orders add column if not exists discount numeric default 0;
alter table orders add column if not exists tax numeric default 0;
alter table orders add column if not exists total numeric default 0;
alter table orders add column if not exists status text default 'pending';
alter table orders add column if not exists payment_status text default 'pending';
alter table orders add column if not exists payment_method text default 'cash_on_delivery';
alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists items jsonb default '[]'::jsonb;
alter table orders add column if not exists notes text;
alter table orders add column if not exists customer text;
alter table orders add column if not exists idempotency_key text;

create unique index if not exists orders_idempotency_key_key on orders (idempotency_key);

alter table orders enable row level security;

-- The admin dashboard is client-side and uses the anon key, so keep read access enabled.
drop policy if exists "orders are readable by everyone" on orders;
create policy "orders are readable by everyone"
  on orders for select using (true);

-- Allow guest checkout inserts
drop policy if exists "orders are insertable by everyone" on orders;
create policy "orders are insertable by everyone"
  on orders for insert with check (true);

-- Allow the admin dashboard to update order status
drop policy if exists "orders are updatable by everyone" on orders;
create policy "orders are updatable by everyone"
  on orders for update using (true) with check (true);
