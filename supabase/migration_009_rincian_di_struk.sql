-- Simpan rincian isi produk (mis. paket promo) per baris transaksi,
-- biar ikut kecetak di struk & struk dapur, bukan cuma nama paketnya doang.
alter table transaction_items add column if not exists item_description text;
