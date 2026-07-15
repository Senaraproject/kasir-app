"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { StoreSettings } from "@/lib/types";

export function StoreSettingsForm({ initialSettings }: { initialSettings: StoreSettings }) {
  const [form, setForm] = useState({
    store_name: initialSettings.store_name,
    address: initialSettings.address ?? "",
    phone: initialSettings.phone ?? "",
    receipt_footer: initialSettings.receipt_footer ?? "",
    tax_percent: String(initialSettings.tax_percent),
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: form.store_name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        receipt_footer: form.receipt_footer.trim() || null,
        tax_percent: Number(form.tax_percent) || 0,
      })
      .eq("id", 1);
    setSaving(false);

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      return;
    }
    toast.success("Pengaturan toko disimpan");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Informasi Toko</h2>

      <div>
        <Label>Nama Toko</Label>
        <Input
          required
          value={form.store_name}
          onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
        />
      </div>

      <div>
        <Label>Alamat</Label>
        <Textarea
          rows={2}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </div>

      <div>
        <Label>No. Telepon</Label>
        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
      </div>

      <div>
        <Label>Pajak (%)</Label>
        <Input
          type="number"
          min={0}
          step="0.1"
          value={form.tax_percent}
          onChange={(e) => setForm((f) => ({ ...f, tax_percent: e.target.value }))}
        />
      </div>

      <div>
        <Label>Catatan di Struk (footer)</Label>
        <Textarea
          rows={2}
          value={form.receipt_footer}
          onChange={(e) => setForm((f) => ({ ...f, receipt_footer: e.target.value }))}
          placeholder="Terima kasih atas kunjungan Anda!"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}
