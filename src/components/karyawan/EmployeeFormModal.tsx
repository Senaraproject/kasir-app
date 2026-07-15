"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import type { Employee, Role } from "@/lib/types";
import { createEmployee, resetEmployeePassword, updateEmployee } from "@/app/(app)/karyawan/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee: Employee | null;
}

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  kasir: "Kasir",
};

export function EmployeeFormModal({ open, onClose, onSaved, employee }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={employee ? "Edit Karyawan" : "Tambah Karyawan"}>
      {open && <EmployeeForm employee={employee} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function EmployeeForm({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(employee?.full_name ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(employee?.role ?? "kasir");
  const [isActive, setIsActive] = useState(employee?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = employee
      ? await updateEmployee(employee.id, { fullName, role, isActive })
      : await createEmployee({ fullName, email, password, role });

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(employee ? "Data karyawan diperbarui" : "Karyawan ditambahkan");
    onSaved();
    onClose();
  }

  async function handleResetPassword() {
    if (!employee || newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    setSaving(true);
    const result = await resetEmployeePassword(employee.id, newPassword);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Kata sandi berhasil direset");
    setShowResetPassword(false);
    setNewPassword("");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nama Lengkap</Label>
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            type="email"
            required
            disabled={!!employee}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {!employee && (
          <div>
            <Label>Kata Sandi</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
        )}

        <div>
          <Label>Peran</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>

        {employee && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Akun aktif (bisa login)
          </label>
        )}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>

      {employee && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          {!showResetPassword ? (
            <button
              onClick={() => setShowResetPassword(true)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Reset kata sandi
            </button>
          ) : (
            <div className="space-y-2">
              <Label>Kata Sandi Baru</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
                <Button type="button" variant="secondary" onClick={handleResetPassword} disabled={saving}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
