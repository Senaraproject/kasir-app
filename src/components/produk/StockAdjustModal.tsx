"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import type { Product } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: Product | null;
}

export function StockAdjustModal({ open, onClose, onSaved, product }: Props) {
  const [type, setType] = useState<"masuk" | "keluar">("masuk");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    const qty = Number(amount);
    if (!qty || qty <= 0) return;

    setSaving(true);
    const supabase = createClient();
    const change = type === "masuk" ? qty : -qty;
    const newStock = Math.max(0, product.stock + change);

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", product.id);

    if (!updateError) {
      await supabase.from("stock_movements").insert({
        product_id: product.id,
        change,
        reason: "penyesuaian",
        note: note.trim() || null,
      });
    }

    setSaving(false);

    if (updateError) {
      toast.error("Gagal mengubah stok: " + updateError.message);
      return;
    }

    toast.success("Stok diperbarui");
    setAmount("");
    setNote("");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Ubah Stok - ${product.name}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">Stok saat ini: {product.stock}</p>

        <div>
          <Label>Jenis</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as "masuk" | "keluar")}>
            <option value="masuk">Stok Masuk (restock)</option>
            <option value="keluar">Stok Keluar (rusak/hilang)</option>
          </Select>
        </div>

        <div>
          <Label>Jumlah</Label>
          <Input
            type="number"
            min={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <Label>Catatan (opsional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Restock dari supplier A" />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Modal>
  );
}
