-- Run in Supabase SQL editor to enable dashboard-managed categories.
create table if not exists categories (
  id text primary key,
  name_key text,
  name_translations jsonb default '{}'::jsonb,
  parent_id text references categories(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table categories enable row level security;

drop policy if exists "categories are viewable by everyone" on categories;
create policy "categories are viewable by everyone"
  on categories for select using (true);

-- Development/demo write access (tighten before production).
drop policy if exists "categories insert anon" on categories;
drop policy if exists "categories update anon" on categories;
drop policy if exists "categories delete anon" on categories;
create policy "categories insert anon" on categories for insert with check (true);
create policy "categories update anon" on categories for update using (true);
create policy "categories delete anon" on categories for delete using (true);
