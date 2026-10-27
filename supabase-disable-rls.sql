-- Disable RLS entirely for development (run in SQL Editor)
alter table products disable row level security;
alter table orders disable row level security;
alter table customers disable row level security;
