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

/** Pecah teks jadi beberapa baris pendek (word-wrap manual) supaya tiap baris tetap
 * dalam batas kolom printer - biar align("center") kepakai bener di tiap baris,
 * gak keserahin ke auto-wrap printer yang biasanya rata-kiri-in baris sambungan. */
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (word.length > maxWidth) {
      let remaining = word;
      while (remaining.length > maxWidth) {
        lines.push(remaining.slice(0, maxWidth));
        remaining = remaining.slice(maxWidth);
      }
      current = remaining;
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
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
    second: "2-digit",
  });

  const itemColW = columns - 10;

  let e = encoder.initialize().align("center").bold(true);
  for (const line of wrapText(store.store_name, columns)) e = e.line(line);
  e = e.bold(false);

  if (store.address) {
    for (const line of wrapText(store.address, columns)) e = e.line(line);
  }
  if (store.phone) e = e.line(store.phone);

  e = e.rule({ style: "dashed" }).align("left").line(`${dateStr} ${timeStr}`);
  if (transaction.employee?.full_name) {
    e = e.line(`Kasir: ${transaction.employee.full_name}`);
  }
  e = e.line(`No. ${transaction.transaction_number}`).rule({ style: "dashed" });

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

  if (transaction.note) {
    e = e.rule({ style: "dashed" }).line(`Catatan: ${transaction.note}`);
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

  const methodLabel = PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method;
  const paidAmount =
    transaction.payment_method === "tunai" && transaction.cash_received != null
      ? transaction.cash_received
      : transaction.total;
  const changeAmount = transaction.payment_method === "tunai" ? transaction.change_amount ?? 0 : 0;

  e = e.table(
    [
      { width: columns - 14, align: "left" },
      { width: 14, align: "right" },
    ],
    [
      [`Bayar(${methodLabel})`, formatRupiah(paidAmount)],
      ["Kembali", formatRupiah(changeAmount)],
    ]
  );

  e = e.rule({ style: "dashed" }).align("center");

  if (store.receipt_footer) {
    e = e.line(store.receipt_footer);
  }

  const result = e.newline().newline().cut().encode();
  return result;
}

/** Struk dapur: cuma daftar item & catatan, tanpa harga/pembayaran, buat dapur nyiapin pesanan. */
export function buildKitchenReceiptBytes(
  transaction: Transaction,
  store: StoreSettings,
  columns: 32 | 42 | 48 = 32
): Uint8Array {
  const encoder = new ReceiptPrinterEncoder({
    language: "esc-pos",
    columns,
  });

  const date = new Date(transaction.created_at);
  const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  let e = encoder
    .initialize()
    .align("center")
    .bold(true)
    .size("normal")
    .line("STRUK DAPUR")
    .bold(false);
  for (const line of wrapText(store.store_name, columns)) e = e.line(line);
  e = e.rule({ style: "dashed" }).align("left").line(`${dateStr} ${timeStr}`);

  if (transaction.employee?.full_name) {
    e = e.line(`Kasir: ${transaction.employee.full_name}`);
  }
  e = e.line(`No. ${transaction.transaction_number}`).rule({ style: "dashed" });

  for (const item of transaction.items ?? []) {
    e = e.bold(true).line(`${item.qty}x ${item.product_name}`).bold(false);
  }

  if (transaction.note) {
    e = e
      .rule({ style: "dashed" })
      .bold(true)
      .line("CATATAN:")
      .line(transaction.note)
      .bold(false);
  }

  e = e.rule({ style: "dashed" });

  const result = e.newline().newline().cut().encode();
  return result;
}
