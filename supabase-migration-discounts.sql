-- Promo codes / discounts
create table if not exists discounts (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  name text not null,
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric not null,
  currency text default 'EUR',
  start_date timestamptz,
  expiry_date timestamptz,
  usage_limit integer,
  per_customer_limit integer,
  min_order_amount numeric default 0,
  status text default 'active' check (status in ('active', 'inactive')),
  applies_to text default 'all'
);

create table if not exists discount_usages (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  discount_id bigint references discounts(id) on delete cascade,
  order_id bigint references orders(id) on delete set null,
  customer_email text,
  amount numeric
);

alter table discounts enable row level security;
alter table discount_usages enable row level security;

drop policy if exists "discounts readable by everyone" on discounts;
create policy "discounts readable by everyone" on discounts for select using (true);

drop policy if exists "discounts writable by everyone" on discounts;
create policy "discounts writable by everyone" on discounts for all using (true) with check (true);

drop policy if exists "discount_usages readable by everyone" on discount_usages;
create policy "discount_usages readable by everyone" on discount_usages for select using (true);

drop policy if exists "discount_usages writable by everyone" on discount_usages;
create policy "discount_usages writable by everyone" on discount_usages for all using (true) with check (true);