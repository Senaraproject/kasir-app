-- ============================================================
-- Migrasi: hapus stok otomatis + tambah metode pembayaran baru
-- Jalankan file ini SEKALI di Supabase Dashboard > SQL Editor
-- (project yang sudah pernah dijalankan schema.sql sebelumnya)
-- ============================================================

-- 1) Matikan pengurangan/pengembalian stok otomatis - stok sekarang
--    diisi & diubah manual lewat halaman Produk.
drop trigger if exists trg_apply_stock_on_sale on transaction_items;
drop trigger if exists trg_restore_stock_on_cancel on transactions;

-- 2) Tambah pilihan metode pembayaran (OVO, GoPay, DANA, ShopeePay).
alter table transactions drop constraint if exists transactions_payment_method_check;
alter table transactions add constraint transactions_payment_method_check
  check (payment_method in ('tunai','qris','gopay','ovo','dana','shopeepay','debit','kredit','transfer','ewallet'));
