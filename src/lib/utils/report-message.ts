import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import type { PaymentMethod, Transaction } from "@/lib/types";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Bangun pesan Telegram rekap penjualan (dipakai buat laporan harian/mingguan/bulanan). */
export function buildSalesReportMessage(
  transactions: Transaction[],
  opts: { icon: string; title: string; periodLabel: string }
): string {
  const completed = transactions.filter((t) => t.status === "selesai");

  const paymentMap = new Map<PaymentMethod, { count: number; total: number }>();
  for (const t of completed) {
    const entry = paymentMap.get(t.payment_method) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += t.total;
    paymentMap.set(t.payment_method, entry);
  }
  const paymentLines = Array.from(paymentMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(
      ([method, v]) =>
        `- ${escapeHtml(PAYMENT_LABELS[method] ?? method)}: ${formatRupiah(v.total)} (${v.count}x)`
    );

  const productMap = new Map<string, { qty: number; revenue: number }>();
  for (const t of completed) {
    for (const item of t.items ?? []) {
      const entry = productMap.get(item.product_name) ?? { qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.subtotal;
      productMap.set(item.product_name, entry);
    }
  }
  const productLines = Array.from(productMap.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .map(([name, v]) => `- ${escapeHtml(name)}: ${v.qty}x (${formatRupiah(v.revenue)})`);

  const totalOmzet = completed.reduce((sum, t) => sum + t.total, 0);

  return [
    `${opts.icon} <b>${opts.title}</b>`,
    ``,
    `📅 Periode: ${opts.periodLabel}`,
    `🧾 Jumlah Transaksi: ${completed.length}`,
    ``,
    `💰 <b>Data Transaksi:</b>`,
    paymentLines.length > 0 ? paymentLines.join("\n") : "- Belum ada transaksi",
    ``,
    `📦 <b>Produk Transaksi:</b>`,
    productLines.length > 0 ? productLines.join("\n") : "- Belum ada produk terjual",
    ``,
    `💵 <b>Total Omzet: ${formatRupiah(totalOmzet)}</b>`,
  ].join("\n");
}
