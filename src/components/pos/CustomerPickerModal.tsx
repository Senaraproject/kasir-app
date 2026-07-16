"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, User } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
}

export function CustomerPickerModal({ open, onClose, onSelect }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Pilih Member" size="sm">
      {open && <CustomerPicker onClose={onClose} onSelect={onSelect} />}
    </Modal>
  );
}

function CustomerPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("customers")
      .select("*")
      .order("name")
      .then(({ data }) => setCustomers(data ?? []));
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search)
      ),
    [customers, search]
  );

  async function handleAddNew() {
    if (!newName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({ name: newName.trim(), phone: newPhone.trim() || null })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error("Gagal menambah member.");
      return;
    }
    onSelect(data as Customer);
    onClose();
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Cari nama atau no. telepon..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />

      <button
        onClick={() => {
          onSelect(null);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
      >
        Tanpa member
      </button>

      <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => {
                onSelect(c);
                onClose();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <User size={14} className="text-slate-400" />
              <span className="font-medium text-slate-800">{c.name}</span>
              {c.phone && <span className="text-xs text-slate-400">{c.phone}</span>}
            </button>
          </li>
        ))}
        {filtered.length === 0 && !showAddForm && (
          <li className="px-3 py-4 text-center text-sm text-slate-400">Member tidak ditemukan.</li>
        )}
      </ul>

      {!showAddForm ? (
        <button
          onClick={() => {
            setNewName(search);
            setShowAddForm(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          <Plus size={16} /> Tambah Member Baru
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <div>
            <Label>Nama</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div>
            <Label>No. Telepon</Label>
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>
          <Button className="w-full" size="sm" onClick={handleAddNew} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan & Pilih"}
          </Button>
        </div>
      )}
    </div>
  );
}
