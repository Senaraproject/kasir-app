import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getStoreTodayParts, getStoreLastWeekRangeUtc, getStoreLastMonthRangeUtc } from "@/lib/utils/date";
import { buildSalesReportMessage } from "@/lib/utils/report-message";
import type { Transaction } from "@/lib/types";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

async function fetchTransactions(from: Date, to: Date) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transactions")
    .select("*, items:transaction_items(*)")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export async function runWeeklyReport(): Promise<{ transactionCount: number }> {
  const { from, to } = getStoreLastWeekRangeUtc();
  const transactions = await fetchTransactions(from, to);

  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "long", year: "numeric" });

  const message = buildSalesReportMessage(transactions, {
    icon: "📈",
    title: "Laporan Transaksi Mingguan",
    periodLabel: `${fmt(from)} - ${fmt(to)}`,
  });
  await sendTelegramMessage(message);

  return { transactionCount: transactions.length };
}

export async function runMonthlyReport(): Promise<{ transactionCount: number }> {
  const { from, to, monthIndex, year } = getStoreLastMonthRangeUtc();
  const transactions = await fetchTransactions(from, to);

  const message = buildSalesReportMessage(transactions, {
    icon: "🗓️",
    title: "Laporan Transaksi Bulanan",
    periodLabel: `${MONTH_NAMES[monthIndex]} ${year}`,
  });
  await sendTelegramMessage(message);

  return { transactionCount: transactions.length };
}

/** Dipanggil sekali sehari - laporan mingguan cuma jalan tiap Senin (rekap minggu lalu),
 * laporan bulanan cuma jalan tiap tanggal 1 (rekap bulan lalu). Hari-hari lain diam aja. */
export async function runPeriodicReportsIfDue(): Promise<{ weekly: boolean; monthly: boolean }> {
  const { weekday, day } = getStoreTodayParts();
  const isMonday = weekday === 1;
  const isFirstOfMonth = day === 1;

  if (isMonday) await runWeeklyReport();
  if (isFirstOfMonth) await runMonthlyReport();

  return { weekly: isMonday, monthly: isFirstOfMonth };
}
