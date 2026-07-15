"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import type { Category, Product } from "@/lib/types";

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
    stock: product ? String(product.stock) : "0",
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
        <Label>Stok</Label>
        <Input
          type="number"
          min={0}
          value={form.stock}
          onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
        />
        <p className="mt-1 text-xs text-slate-400">
          Stok diisi & diperbarui manual, sistem gak otomatis menguranginya saat transaksi.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Produk"}
      </Button>
    </form>
  );
}
