"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendDailyReportNow, sendWeeklyReportNow, sendMonthlyReportNow } from "@/app/(app)/pengaturan/actions";

type Kind = "daily" | "weekly" | "monthly";

const ACTIONS: Record<Kind, () => Promise<{ error: string | null; transactionCount: number }>> = {
  daily: sendDailyReportNow,
  weekly: sendWeeklyReportNow,
  monthly: sendMonthlyReportNow,
};

export function TelegramReportSettings() {
  const [sending, setSending] = useState<Kind | null>(null);

  async function handleSendNow(kind: Kind) {
    setSending(kind);
    const result = await ACTIONS[kind]();
    setSending(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Laporan terkirim (${result.transactionCount} transaksi)`);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Send size={16} /> Laporan ke Telegram
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Rekap transaksi (rincian pembayaran & produk terjual) otomatis terkirim ke Telegram:
        <br />- <strong>Harian</strong>, tiap jam <strong>22:00 WIB</strong>
        <br />- <strong>Mingguan</strong>, tiap <strong>Senin pagi</strong> (rekap minggu lalu)
        <br />- <strong>Bulanan</strong>, tiap <strong>tanggal 1</strong> (rekap bulan lalu)
        <br />
        Perlu <code>TELEGRAM_BOT_TOKEN</code> & <code>TELEGRAM_CHAT_ID</code> sudah diisi di Environment
        Variables Vercel.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => handleSendNow("daily")} disabled={sending !== null}>
          {sending === "daily" ? "Mengirim..." : "Test Laporan Harian"}
        </Button>
        <Button variant="secondary" onClick={() => handleSendNow("weekly")} disabled={sending !== null}>
          {sending === "weekly" ? "Mengirim..." : "Test Laporan Mingguan"}
        </Button>
        <Button variant="secondary" onClick={() => handleSendNow("monthly")} disabled={sending !== null}>
          {sending === "monthly" ? "Mengirim..." : "Test Laporan Bulanan"}
        </Button>
      </div>
    </div>
  );
}
