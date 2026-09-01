import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getStoreTodayRangeUtc } from "@/lib/utils/date";
import { buildSalesReportMessage } from "@/lib/utils/report-message";
import type { Transaction } from "@/lib/types";

export async function runDailyReport(): Promise<{ transactionCount: number }> {
  const { from, to } = getStoreTodayRangeUtc();
  const admin = createAdminClient();

  const { data: transactions, error } = await admin
    .from("transactions")
    .select("*, items:transaction_items(*)")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const dayLabel = from.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const message = buildSalesReportMessage((transactions ?? []) as Transaction[], {
    icon: "📊",
    title: "Laporan Transaksi Harian",
    periodLabel: dayLabel,
  });
  await sendTelegramMessage(message);

  return { transactionCount: transactions?.length ?? 0 };
}
