"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { Customer } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
  customer: Customer | null;
}

export function MemberFormModal({ open, onClose, onSaved, customer }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={customer ? "Edit Member" : "Tambah Member"} size="sm">
      {open && <MemberForm customer={customer} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function MemberForm({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [note, setNote] = useState(customer?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      note: note.trim() || null,
    };

    const query = customer
      ? supabase.from("customers").update(payload).eq("id", customer.id)
      : supabase.from("customers").insert(payload);

    const { data, error } = await query.select().single();
    setSaving(false);

    if (error || !data) {
      toast.error("Gagal menyimpan member: " + (error?.message ?? ""));
      return;
    }

    toast.success(customer ? "Member diperbarui" : "Member ditambahkan");
    onSaved(data as Customer);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nama</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>No. Telepon</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Catatan (opsional)</Label>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
