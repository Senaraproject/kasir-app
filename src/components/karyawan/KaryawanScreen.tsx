"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Employee, Role } from "@/lib/types";
import { EmployeeFormModal } from "@/components/karyawan/EmployeeFormModal";
import { deleteEmployee } from "@/app/(app)/karyawan/actions";
import { createClient } from "@/lib/supabase/client";

const ROLE_LABELS: Record<Role, string> = { owner: "Owner", admin: "Admin", kasir: "Kasir" };

export function KaryawanScreen({
  initialEmployees,
  currentEmployeeId,
}: {
  initialEmployees: Employee[];
  currentEmployeeId: string;
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEmployees(data);
  }

  function handleDelete(employee: Employee) {
    if (!confirm(`Hapus akun karyawan "${employee.full_name}"?`)) return;
    startTransition(async () => {
      const result = await deleteEmployee(employee.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Karyawan dihapus");
      refresh();
    });
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Karyawan</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Tambah Karyawan
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Peran</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {emp.full_name}
                  {emp.id === currentEmployeeId && (
                    <span className="ml-2 text-xs font-normal text-slate-400">(Anda)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={emp.role === "owner" ? "blue" : emp.role === "admin" ? "amber" : "slate"}>
                    {ROLE_LABELS[emp.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={emp.is_active ? "green" : "red"}>
                    {emp.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditing(emp);
                        setFormOpen(true);
                      }}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    {emp.id !== currentEmployeeId && (
                      <button
                        onClick={() => handleDelete(emp)}
                        disabled={isPending}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Belum ada karyawan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
        employee={editing}
      />
    </div>
  );
}
