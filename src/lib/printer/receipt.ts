import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { formatRupiah } from "@/lib/utils/currency";
import type { StoreSettings, Transaction } from "@/lib/types";

export const PAYMENT_LABELS: Record<string, string> = {
  tunai: "Tunai",
  qris: "QRIS",
  gopay: "GoPay",
  ovo: "OVO",
  dana: "DANA",
  shopeepay: "ShopeePay",
  debit: "Kartu Debit",
  kredit: "Kartu Kredit",
  transfer: "Transfer Bank",
  ewallet: "E-Wallet Lainnya",
};

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "." : text;
}

/** Bangun perintah ESC/POS (Uint8Array) untuk dikirim ke printer thermal 58mm/80mm. */
export function buildReceiptBytes(
  transaction: Transaction,
  store: StoreSettings,
  columns: 32 | 42 | 48 = 32
): Uint8Array {
  const encoder = new ReceiptPrinterEncoder({
    language: "esc-pos",
    columns,
  });

  const date = new Date(transaction.created_at);
  const dateStr = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemColW = columns - 10;

  let e = encoder
    .initialize()
    .align("center")
    .bold(true)
    .line(store.store_name)
    .bold(false);

  if (store.address) e = e.line(store.address);
  if (store.phone) e = e.line(store.phone);

  e = e
    .rule({ style: "dashed" })
    .align("left")
    .line(`No: ${transaction.transaction_number}`)
    .line(`${dateStr} ${timeStr}`)
    .rule({ style: "dashed" });

  for (const item of transaction.items ?? []) {
    e = e.line(truncate(item.product_name, itemColW));
    e = e.table(
      [
        { width: columns - 14, align: "left" },
        { width: 14, align: "right" },
      ],
      [[`${item.qty} x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal)]]
    );
  }

  e = e.rule({ style: "dashed" });

  e = e.table(
    [
      { width: columns - 14, align: "left" },
      { width: 14, align: "right" },
    ],
    [["Subtotal", formatRupiah(transaction.subtotal)]]
  );

  if (transaction.discount > 0) {
    e = e.table(
      [
        { width: columns - 14, align: "left" },
        { width: 14, align: "right" },
      ],
      [["Diskon", `-${formatRupiah(transaction.discount)}`]]
    );
  }

  if (transaction.tax > 0) {
    e = e.table(
      [
        { width: columns - 14, align: "left" },
        { width: 14, align: "right" },
      ],
      [["Pajak", formatRupiah(transaction.tax)]]
    );
  }

  e = e
    .bold(true)
    .table(
      [
        { width: columns - 14, align: "left" },
        { width: 14, align: "right" },
      ],
      [["TOTAL", formatRupiah(transaction.total)]]
    )
    .bold(false);

  e = e.table(
    [
      { width: columns - 14, align: "left" },
      { width: 14, align: "right" },
    ],
    [[PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method, ""]]
  );

  if (transaction.payment_method === "tunai" && transaction.cash_received != null) {
    e = e.table(
      [
        { width: columns - 14, align: "left" },
        { width: 14, align: "right" },
      ],
      [
        ["Bayar", formatRupiah(transaction.cash_received)],
        ["Kembali", formatRupiah(transaction.change_amount ?? 0)],
      ]
    );
  }

  e = e.rule({ style: "dashed" }).align("center");

  if (store.receipt_footer) {
    e = e.line(store.receipt_footer);
  }

  const result = e.newline().newline().cut().encode();
  return result;
}
