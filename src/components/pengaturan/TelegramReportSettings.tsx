"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendDailyReportNow } from "@/app/(app)/pengaturan/actions";

export function TelegramReportSettings() {
  const [sending, setSending] = useState(false);

  async function handleSendNow() {
    setSending(true);
    const result = await sendDailyReportNow();
    setSending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Laporan terkirim (${result.transactionCount} transaksi hari ini)`);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Send size={16} /> Laporan Harian ke Telegram
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Ringkasan transaksi hari ini (rincian pembayaran & produk terjual) otomatis terkirim ke
        Telegram tiap jam <strong>23:00 WIB</strong>. Perlu <code>TELEGRAM_BOT_TOKEN</code> &{" "}
        <code>TELEGRAM_CHAT_ID</code> sudah diisi di Environment Variables Vercel.
      </p>
      <Button variant="secondary" onClick={handleSendNow} disabled={sending}>
        {sending ? "Mengirim..." : "Kirim Laporan Sekarang (Test)"}
      </Button>
    </div>
  );
}
