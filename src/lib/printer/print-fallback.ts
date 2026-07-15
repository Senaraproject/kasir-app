import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import type { StoreSettings, Transaction } from "@/lib/types";

/** Cetak struk lewat dialog print bawaan browser (bisa ke printer apa saja, atau simpan sebagai PDF). */
export function printViaBrowser(transaction: Transaction, store: StoreSettings) {
  const date = new Date(transaction.created_at);
  const dateStr = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const rows = (transaction.items ?? [])
    .map(
      (item) => `
        <div class="item">
          <div>${escapeHtml(item.product_name)}</div>
          <div class="item-line">
            <span>${item.qty} x ${formatRupiah(item.price)}</span>
            <span>${formatRupiah(item.subtotal)}</span>
          </div>
        </div>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Struk ${escapeHtml(transaction.transaction_number)}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; }
  body {
    font-family: "Courier New", monospace;
    width: 80mm;
    margin: 0 auto;
    padding: 8px;
    font-size: 12px;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .item { margin-bottom: 4px; }
  .item-line, .totals-line { display: flex; justify-content: space-between; }
  .totals-line.grand { font-weight: 700; font-size: 14px; }
  .footer { margin-top: 8px; }
</style>
</head>
<body>
  <div class="center bold">${escapeHtml(store.store_name)}</div>
  ${store.address ? `<div class="center">${escapeHtml(store.address)}</div>` : ""}
  ${store.phone ? `<div class="center">${escapeHtml(store.phone)}</div>` : ""}
  <hr />
  <div>No: ${escapeHtml(transaction.transaction_number)}</div>
  <div>${dateStr} ${timeStr}</div>
  <hr />
  ${rows}
  <hr />
  <div class="totals-line"><span>Subtotal</span><span>${formatRupiah(transaction.subtotal)}</span></div>
  ${transaction.discount > 0 ? `<div class="totals-line"><span>Diskon</span><span>-${formatRupiah(transaction.discount)}</span></div>` : ""}
  ${transaction.tax > 0 ? `<div class="totals-line"><span>Pajak</span><span>${formatRupiah(transaction.tax)}</span></div>` : ""}
  <div class="totals-line grand"><span>TOTAL</span><span>${formatRupiah(transaction.total)}</span></div>
  <div class="totals-line"><span>${PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method}</span><span></span></div>
  ${
    transaction.payment_method === "tunai" && transaction.cash_received != null
      ? `<div class="totals-line"><span>Bayar</span><span>${formatRupiah(transaction.cash_received)}</span></div>
         <div class="totals-line"><span>Kembali</span><span>${formatRupiah(transaction.change_amount ?? 0)}</span></div>`
      : ""
  }
  <hr />
  ${store.receipt_footer ? `<div class="center footer">${escapeHtml(store.receipt_footer)}</div>` : ""}
  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) {
    throw new Error("Popup diblokir browser. Izinkan popup untuk mencetak struk.");
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
