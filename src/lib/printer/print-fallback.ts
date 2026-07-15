import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import type { StoreSettings, Transaction } from "@/lib/types";

/** Cetak struk lewat dialog print bawaan browser (bisa ke printer apa saja, atau simpan sebagai PDF). */
export function printViaBrowser(transaction: Transaction, store: StoreSettings) {
  const date = new Date(transaction.created_at);
  const dateStr = date.toLocaleDateString("sv-SE");
  const timeStr = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const methodLabel = PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method;
  const paidAmount =
    transaction.payment_method === "tunai" && transaction.cash_received != null
      ? transaction.cash_received
      : transaction.total;
  const changeAmount = transaction.payment_method === "tunai" ? transaction.change_amount ?? 0 : 0;

  const rows = (transaction.items ?? [])
    .map(
      (item) => `
        <div class="item">
          <div class="item-name">${escapeHtml(item.product_name)}</div>
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
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #eaf7f0;
    font-family: "Quicksand", "Trebuchet MS", sans-serif;
    color: #1f2937;
  }
  body {
    display: flex;
    justify-content: center;
    padding: 24px 12px 0;
  }
  .receipt {
    width: 100%;
    max-width: 360px;
    background: #ffffff;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 10px 30px rgba(16, 40, 30, 0.08);
    padding: 28px 24px 18px;
    -webkit-mask-image: radial-gradient(circle 7px at 7px 100%, transparent 7px, black 7.5px);
    -webkit-mask-size: 14px 100%;
    -webkit-mask-repeat: repeat-x;
    -webkit-mask-position: bottom;
    mask-image: radial-gradient(circle 7px at 7px 100%, transparent 7px, black 7.5px);
    mask-size: 14px 100%;
    mask-repeat: repeat-x;
    mask-position: bottom;
    padding-bottom: 26px;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .store-name { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
  .address { font-size: 13px; color: #5b6b63; line-height: 1.5; }
  hr { border: none; border-top: 2px dashed #cfe0d8; margin: 16px 0; }
  .info-row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 13px; }
  .info-row .datetime { line-height: 1.5; }
  .info-row .cashier { font-weight: 700; }
  .order-no { margin-top: 8px; font-size: 13px; }
  .item { margin-bottom: 14px; }
  .item-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
  .item-line, .totals-line { display: flex; justify-content: space-between; font-size: 14px; }
  .totals-line { padding: 3px 0; }
  .totals-line.grand { font-weight: 700; font-size: 17px; padding-top: 6px; }
  .footer { margin-top: 10px; font-size: 12px; color: #5b6b63; }

  @media print {
    html, body { background: #fff; padding: 0; }
    .receipt {
      max-width: 100%;
      box-shadow: none;
      border-radius: 0;
      -webkit-mask-image: none;
      mask-image: none;
      padding: 8px;
    }
    .store-name { font-size: 16px; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center store-name">${escapeHtml(store.store_name)}</div>
    ${store.address ? `<div class="center address">${escapeHtml(store.address)}</div>` : ""}
    ${store.phone ? `<div class="center address">${escapeHtml(store.phone)}</div>` : ""}
    <hr />
    <div class="info-row">
      <div class="datetime">${dateStr}<br />${timeStr}</div>
      ${transaction.employee?.full_name ? `<div class="cashier">${escapeHtml(transaction.employee.full_name)}</div>` : ""}
    </div>
    <div class="order-no">No. ${escapeHtml(transaction.transaction_number)}</div>
    <hr />
    ${rows}
    <hr />
    ${transaction.discount > 0 ? `<div class="totals-line"><span>Subtotal</span><span>${formatRupiah(transaction.subtotal)}</span></div><div class="totals-line"><span>Diskon</span><span>-${formatRupiah(transaction.discount)}</span></div>` : ""}
    ${transaction.tax > 0 ? `<div class="totals-line"><span>Pajak</span><span>${formatRupiah(transaction.tax)}</span></div>` : ""}
    <div class="totals-line grand"><span>Total</span><span>${formatRupiah(transaction.total)}</span></div>
    <div class="totals-line"><span>Bayar(${escapeHtml(methodLabel)})</span><span>${formatRupiah(paidAmount)}</span></div>
    <div class="totals-line"><span>Kembali</span><span>${formatRupiah(changeAmount)}</span></div>
    ${store.receipt_footer ? `<hr /><div class="center footer">${escapeHtml(store.receipt_footer)}</div>` : ""}
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 200);
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=420,height=680");
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
