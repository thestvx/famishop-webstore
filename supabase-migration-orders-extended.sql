-- Run in Supabase SQL editor to support FamiShop checkout orders.
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
  items jsonb default '[]'::jsonb,
  notes text,
  idempotency_key text unique
);

-- Public read is intentionally NOT enabled; admin uses service role / authenticated access.
alter table orders enable row level security;

-- Allow guest checkout inserts
drop policy if exists "orders are insertable by everyone" on orders;
create policy "orders are insertable by everyone"
  on orders for insert with check (true);
