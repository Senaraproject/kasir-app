-- ============================================================
-- Migrasi: tambah "Tipe Barang" (Default / Add On / Paket) ke produk
-- Jalankan file ini SEKALI di Supabase Dashboard > SQL Editor
-- ============================================================

alter table products add column if not exists item_type text not null default 'default';

alter table products drop constraint if exists products_item_type_check;
alter table products add constraint products_item_type_check
  check (item_type in ('default','addon','paket'));
