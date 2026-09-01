"use server";

import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { runDailyReport } from "@/lib/daily-report";
import { runWeeklyReport, runMonthlyReport } from "@/lib/periodic-report";

export async function sendDailyReportNow() {
  await requireOwnerOrAdmin();
  try {
    const result = await runDailyReport();
    return { error: null, transactionCount: result.transactionCount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim laporan", transactionCount: 0 };
  }
}

export async function sendWeeklyReportNow() {
  await requireOwnerOrAdmin();
  try {
    const result = await runWeeklyReport();
    return { error: null, transactionCount: result.transactionCount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim laporan", transactionCount: 0 };
  }
}

export async function sendMonthlyReportNow() {
  await requireOwnerOrAdmin();
  try {
    const result = await runMonthlyReport();
    return { error: null, transactionCount: result.transactionCount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim laporan", transactionCount: 0 };
  }
}
