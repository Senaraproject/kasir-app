-- Rincian isi produk (terutama paket promo), tampil di kartu produk Kasir.
alter table products add column if not exists description text;
