-- Tambah "ceo" sebagai metode pembayaran pribadi.
alter table transactions drop constraint if exists transactions_payment_method_check;
alter table transactions add constraint transactions_payment_method_check
  check (payment_method in ('tunai','qris','gopay','ovo','dana','shopeepay','debit','kredit','transfer','ewallet','ceo'));
