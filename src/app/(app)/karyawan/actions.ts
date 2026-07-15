"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export async function createEmployee(input: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}) {
  await requireOwnerOrAdmin();
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Gagal membuat akun karyawan." };
  }

  const { error: insertError } = await admin.from("employees").insert({
    id: created.user.id,
    full_name: input.fullName,
    email: input.email,
    role: input.role,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: insertError.message };
  }

  revalidatePath("/karyawan");
  return { error: null };
}

export async function updateEmployee(
  id: string,
  input: { fullName: string; role: Role; isActive: boolean }
) {
  await requireOwnerOrAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("employees")
    .update({ full_name: input.fullName, role: input.role, is_active: input.isActive })
    .eq("id", id);

  revalidatePath("/karyawan");
  return { error: error?.message ?? null };
}

export async function resetEmployeePassword(id: string, newPassword: string) {
  await requireOwnerOrAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: newPassword });
  return { error: error?.message ?? null };
}

export async function deleteEmployee(id: string) {
  const actor = await requireOwnerOrAdmin();
  if (actor.id === id) {
    return { error: "Tidak bisa menghapus akun Anda sendiri." };
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  revalidatePath("/karyawan");
  return { error: error?.message ?? null };
}
