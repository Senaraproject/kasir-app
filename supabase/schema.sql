-- ============================================================
-- Skema Database Aplikasi Kasir
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- BRANCHES (cabang toko, siap untuk multi-cabang nanti) ----------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

-- Toko default untuk instalasi single-branch
insert into branches (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Toko Utama')
on conflict (id) do nothing;

-- ---------- EMPLOYEES (karyawan, terhubung ke auth.users Supabase) ----------
create table if not exists employees (
  id uuid primary key references auth.users(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null default 'kasir' check (role in ('owner','admin','kasir')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- CATEGORIES (kategori produk) ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  sku text,
  barcode text,
  price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  stock integer not null default 999999,
  low_stock_threshold integer not null default 5,
  item_type text not null default 'default' check (item_type in ('default','addon','paket')),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_barcode on products(barcode);

-- ---------- STOCK MOVEMENTS (riwayat perubahan stok) ----------
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  change integer not null,
  reason text not null check (reason in ('penjualan','restock','penyesuaian','pembatalan')),
  employee_id uuid references employees(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- TRANSACTIONS ----------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  transaction_number text not null unique,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null check (payment_method in ('tunai','qris','gopay','ovo','dana','shopeepay','debit','kredit','transfer','ewallet')),
  cash_received numeric(12,2),
  change_amount numeric(12,2),
  status text not null default 'selesai' check (status in ('selesai','dibatalkan')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_created on transactions(created_at);
create index if not exists idx_transactions_employee on transactions(employee_id);

-- ---------- TRANSACTION ITEMS ----------
create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price numeric(12,2) not null,
  qty integer not null,
  subtotal numeric(12,2) not null
);

create index if not exists idx_transaction_items_transaction on transaction_items(transaction_id);

-- ---------- STORE SETTINGS (info toko utk struk) ----------
create table if not exists store_settings (
  id int primary key default 1,
  store_name text not null default 'Toko Saya',
  address text,
  phone text,
  receipt_footer text default 'Terima kasih atas kunjungan Anda!',
  tax_percent numeric(5,2) not null default 0,
  constraint single_row check (id = 1)
);

insert into store_settings (id) values (1) on conflict (id) do nothing;

-- Catatan: stok TIDAK dikelola otomatis oleh sistem (tidak ada trigger
-- pengurangan/pengembalian stok). Stok diisi & diperbarui manual lewat
-- halaman Produk, sesuai kebutuhan toko.

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table branches enable row level security;
alter table employees enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table stock_movements enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;
alter table store_settings enable row level security;

-- Helper: cek apakah user login adalah employee aktif
create or replace function is_active_employee()
returns boolean as $$
  select exists (
    select 1 from employees where id = auth.uid() and is_active = true
  );
$$ language sql security definer stable;

-- Helper: cek apakah user login owner/admin
create or replace function is_admin_or_owner()
returns boolean as $$
  select exists (
    select 1 from employees where id = auth.uid() and is_active = true and role in ('owner','admin')
  );
$$ language sql security definer stable;

-- branches: semua karyawan aktif boleh baca, hanya owner/admin boleh ubah
create policy "branches_select" on branches for select using (is_active_employee());
create policy "branches_write" on branches for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- employees: karyawan boleh lihat data diri sendiri & rekan kerja, hanya owner/admin boleh ubah data karyawan
create policy "employees_select" on employees for select using (is_active_employee());
create policy "employees_insert" on employees for insert with check (is_admin_or_owner());
create policy "employees_update" on employees for update using (is_admin_or_owner());
create policy "employees_delete" on employees for delete using (is_admin_or_owner());

-- categories & products: semua karyawan aktif boleh baca & kelola
create policy "categories_all" on categories for all using (is_active_employee()) with check (is_active_employee());
create policy "products_all" on products for all using (is_active_employee()) with check (is_active_employee());
create policy "stock_movements_all" on stock_movements for all using (is_active_employee()) with check (is_active_employee());

-- transactions & items: semua karyawan aktif boleh buat & lihat
create policy "transactions_select" on transactions for select using (is_active_employee());
create policy "transactions_insert" on transactions for insert with check (is_active_employee());
create policy "transactions_update" on transactions for update using (is_admin_or_owner());

create policy "transaction_items_select" on transaction_items for select using (is_active_employee());
create policy "transaction_items_insert" on transaction_items for insert with check (is_active_employee());

-- store_settings: semua karyawan boleh baca, hanya owner/admin boleh ubah
create policy "store_settings_select" on store_settings for select using (is_active_employee());
create policy "store_settings_write" on store_settings for update using (is_admin_or_owner());
