-- ============================================================
-- Migrasi: stok otomatis per-produk (bukan global lagi)
-- Jalankan file ini SEKALI di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Kolom penanda produk mana yang stoknya dilacak otomatis
alter table products add column if not exists track_stock boolean not null default false;

-- 2) Trigger: kurangi stok otomatis SAAT TERJUAL, tapi cuma buat
--    produk yang track_stock = true. Produk lain gak kesentuh sama sekali.
create or replace function fn_apply_stock_on_sale()
returns trigger as $$
begin
  update products set stock = greatest(0, stock - new.qty), updated_at = now()
  where id = new.product_id and track_stock = true;

  if found then
    insert into stock_movements (product_id, change, reason, employee_id)
    select new.product_id, -new.qty, 'penjualan', t.employee_id
    from transactions t where t.id = new.transaction_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_apply_stock_on_sale on transaction_items;
create trigger trg_apply_stock_on_sale
  after insert on transaction_items
  for each row execute function fn_apply_stock_on_sale();

-- 3) Trigger: kembalikan stok kalau transaksi dibatalkan, sama juga
--    cuma buat produk yang track_stock = true.
create or replace function fn_restore_stock_on_cancel()
returns trigger as $$
begin
  if new.status = 'dibatalkan' and old.status <> 'dibatalkan' then
    update products p set stock = p.stock + ti.qty, updated_at = now()
    from transaction_items ti
    where ti.transaction_id = new.id and ti.product_id = p.id and p.track_stock = true;

    insert into stock_movements (product_id, change, reason, employee_id)
    select ti.product_id, ti.qty, 'pembatalan', new.employee_id
    from transaction_items ti
    join products p on p.id = ti.product_id
    where ti.transaction_id = new.id and p.track_stock = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_restore_stock_on_cancel on transactions;
create trigger trg_restore_stock_on_cancel
  after update on transactions
  for each row execute function fn_restore_stock_on_cancel();
