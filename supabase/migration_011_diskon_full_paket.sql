-- Diskon otomatis khusus 1 produk (mis. Full Paket Naslur Komplit: 20%).
-- Diterapkan otomatis pas produk ditambah ke keranjang, gak perlu toggle manual.
alter table products add column if not exists auto_discount_percent numeric(5,2) not null default 0;

update products set auto_discount_percent = 20 where name = 'Naslur Komplit';
