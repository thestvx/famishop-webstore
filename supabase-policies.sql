-- Run this in Supabase SQL editor to allow admin writes (dev/demo)
-- WARNING: These are permissive policies for development. Tighten before production.

drop policy if exists "products insert anon" on products;
drop policy if exists "products update anon" on products;
drop policy if exists "products delete anon" on products;

create policy "products insert anon" on products for insert with check (true);
create policy "products update anon" on products for update using (true);
create policy "products delete anon" on products for delete using (true);

-- Orders & customers
drop policy if exists "orders all anon" on orders;
drop policy if exists "customers all anon" on customers;
create policy "orders all anon" on orders for all using (true);
create policy "customers all anon" on customers for all using (true);
