-- ============================================================
-- Migrasi: default stok produk baru jadi "unlimited" (999999)
-- Jalankan file ini SEKALI di Supabase Dashboard > SQL Editor
-- ============================================================

alter table products alter column stock set default 999999;
