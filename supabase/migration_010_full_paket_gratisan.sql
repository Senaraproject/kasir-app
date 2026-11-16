-- Full Paket (Naslur Komplit) sekarang termasuk 1 minuman gratis (Aqua/Pucuk) + Kerupuk gratis.
alter table products add column if not exists has_drink_option boolean not null default false;

update products set has_drink_option = true where name = 'Naslur Komplit';
