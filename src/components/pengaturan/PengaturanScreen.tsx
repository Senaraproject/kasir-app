"use client";

import type { StoreSettings } from "@/lib/types";
import { StoreSettingsForm } from "@/components/pengaturan/StoreSettingsForm";
import { PrinterSettings } from "@/components/pengaturan/PrinterSettings";

export function PengaturanScreen({ initialSettings }: { initialSettings: StoreSettings | null }) {
  if (!initialSettings) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Pengaturan toko belum tersedia. Pastikan skema database sudah dijalankan di Supabase.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Pengaturan</h1>
      <StoreSettingsForm initialSettings={initialSettings} />
      <PrinterSettings storeSettings={initialSettings} />
    </div>
  );
}
