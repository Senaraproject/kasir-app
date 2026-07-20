"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import type { Category, ItemType, Product } from "@/lib/types";

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  default: "Default",
  addon: "Add On",
  paket: "Paket",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  product: Product | null;
}

export function ProductFormModal({ open, onClose, onSaved, categories, product }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit Produk" : "Tambah Produk"}>
      {open && (
        <ProductForm
          categories={categories}
          product={product}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function ProductForm({
  categories,
  product,
  onClose,
  onSaved,
}: {
  categories: Category[];
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    category_id: product?.category_id ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    price: product ? String(product.price) : "",
    cost_price: product ? String(product.cost_price) : "",
    stock: product ? String(product.stock) : "999999",
    item_type: product?.item_type ?? ("default" as ItemType),
    track_stock: product?.track_stock ?? false,
  }));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      sku: form.sku.trim() || null,
      barcode: form.barcode.trim() || null,
      price: Number(form.price) || 0,
      cost_price: Number(form.cost_price) || 0,
      stock: Number(form.stock) || 0,
      item_type: form.item_type,
      track_stock: form.track_stock,
    };

    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Gagal menyimpan produk: " + error.message);
      return;
    }

    toast.success(product ? "Produk diperbarui" : "Produk ditambahkan");
    onSaved();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nama Produk</Label>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div>
        <Label>Kategori</Label>
        <Select
          value={form.category_id}
          onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
        >
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        </div>
        <div>
          <Label>Barcode</Label>
          <Input
            value={form.barcode}
            onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Harga Jual (Rp)</Label>
          <Input
            type="number"
            min={0}
            required
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>
        <div>
          <Label>Harga Modal (Rp)</Label>
          <Input
            type="number"
            min={0}
            value={form.cost_price}
            onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Tipe Barang</Label>
        <Select
          value={form.item_type}
          onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value as ItemType }))}
        >
          {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((t) => (
            <option key={t} value={t}>
              {ITEM_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Stok</Label>
        <Input
          type="number"
          min={0}
          value={form.stock}
          onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.track_stock}
          onChange={(e) => setForm((f) => ({ ...f, track_stock: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300"
        />
        Lacak stok otomatis (berkurang tiap terjual, balik lagi kalau transaksi dibatalkan)
      </label>
      {!form.track_stock && (
        <p className="-mt-2 text-xs text-slate-400">
          Kalau gak dicentang, stok cuma angka manual - gak berubah otomatis saat ada transaksi.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Produk"}
      </Button>
    </form>
  );
}
