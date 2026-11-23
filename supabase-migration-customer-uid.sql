-- Add customer UID linkage to orders
alter table orders add column if not exists customer_uid text;
create index if not exists orders_customer_uid_idx on orders (customer_uid);
