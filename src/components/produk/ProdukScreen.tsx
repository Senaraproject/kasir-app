"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { formatRupiah } from "@/lib/utils/currency";
import type { Category, ItemType, Product } from "@/lib/types";
import { ProductFormModal } from "@/components/produk/ProductFormModal";
import { CategoryModal } from "@/components/produk/CategoryModal";
import { Badge } from "@/components/ui/Badge";

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  default: "Default",
  addon: "Add On",
  paket: "Paket",
};

interface Props {
  initialProducts: Product[];
  initialCategories: Category[];
}

export function ProdukScreen({ initialProducts, initialCategories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (typeFilter === "all" || p.item_type === typeFilter) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode ?? "").includes(search))
      ),
    [products, search, typeFilter]
  );

  async function refresh() {
    const supabase = createClient();
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*, category:categories(*)").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    if (p) setProducts(p as Product[]);
    if (c) setCategories(c);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error("Gagal menghapus (mungkin sudah ada di riwayat transaksi). Coba nonaktifkan saja.");
      return;
    }
    toast.success("Produk dihapus");
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Produk</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            <Tags size={16} /> Kategori
          </Button>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Tambah Produk
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          className="w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ItemType | "all")}
        >
          <option value="all">Semua Tipe Barang</option>
          {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((t) => (
            <option key={t} value={t}>
              {ITEM_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3">Tipe Barang</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{product.name}</p>
                  {product.sku && <p className="text-xs text-slate-400">SKU: {product.sku}</p>}
                </td>
                <td className="px-4 py-3 text-slate-500">{product.category?.name ?? "-"}</td>
                <td className="px-4 py-3 text-right font-medium">{formatRupiah(product.price)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{product.stock}</td>
                <td className="px-4 py-3">
                  <Badge tone={product.item_type === "addon" ? "amber" : product.item_type === "paket" ? "blue" : "slate"}>
                    {ITEM_TYPE_LABELS[product.item_type]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormOpen(true);
                      }}
                      title="Edit"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      title="Hapus"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
        categories={categories}
        product={editingProduct}
      />
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onChanged={refresh}
      />
    </div>
  );
}
