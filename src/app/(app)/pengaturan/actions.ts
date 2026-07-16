"use server";

import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { runDailyReport } from "@/lib/daily-report";

export async function sendDailyReportNow() {
  await requireOwnerOrAdmin();
  try {
    const result = await runDailyReport();
    return { error: null, transactionCount: result.transactionCount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim laporan", transactionCount: 0 };
  }
}
