-- ============================================================
-- Migrasi: catatan transaksi, member/pelanggan, simpan pesanan
-- Jalankan file ini SEKALI di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Catatan (notes) per transaksi, mis. "gak pake cabe"
alter table transactions add column if not exists note text;

-- 2) Member / pelanggan
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  note text,
  created_at timestamptz not null default now()
);

alter table transactions add column if not exists customer_id uuid references customers(id) on delete set null;

alter table customers enable row level security;
drop policy if exists "customers_all" on customers;
create policy "customers_all" on customers for all using (is_active_employee()) with check (is_active_employee());

-- 3) Simpan Pesanan (hold order) - keranjang yang disimpan sementara sebelum bayar
create table if not exists held_orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  label text,
  items jsonb not null,
  discount numeric(12,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

alter table held_orders enable row level security;
drop policy if exists "held_orders_all" on held_orders;
create policy "held_orders_all" on held_orders for all using (is_active_employee()) with check (is_active_employee());
