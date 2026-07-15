"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onChanged: () => void;
}

export function CategoryModal({ open, onClose, categories, onChanged }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert({ name: name.trim() });
    setSaving(false);

    if (error) {
      toast.error("Gagal menambah kategori: " + error.message);
      return;
    }
    setName("");
    onChanged();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus kategori (mungkin masih dipakai produk).");
      return;
    }
    onChanged();
  }

  return (
    <Modal open={open} onClose={onClose} title="Kelola Kategori" size="sm">
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <Input
          placeholder="Nama kategori baru"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={saving}>
          <Plus size={16} />
        </Button>
      </form>

      <ul className="space-y-1">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
          >
            {c.name}
            <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {categories.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">Belum ada kategori.</p>
        )}
      </ul>
    </Modal>
  );
}
