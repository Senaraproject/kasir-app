-- Tandain produk yang butuh pilihan nasi (putih / daun jeruk) pas ditambah ke keranjang,
-- supaya gak keliru/ketuker pas transaksi ada beberapa Naslur sekaligus.
alter table products add column if not exists has_rice_option boolean not null default false;

update products set has_rice_option = true
where lower(name) like 'naslur%' or lower(name) like 'promo naslur%';
