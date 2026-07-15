import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";
import { redirect } from "next/navigation";

/** Ambil data karyawan yang sedang login (server-side). Redirect ke /login jika belum login atau nonaktif. */
export async function requireEmployee(): Promise<Employee> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!employee || !employee.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return employee as Employee;
}

export async function requireOwnerOrAdmin(): Promise<Employee> {
  const employee = await requireEmployee();
  if (employee.role !== "owner" && employee.role !== "admin") {
    redirect("/kasir");
  }
  return employee;
}
