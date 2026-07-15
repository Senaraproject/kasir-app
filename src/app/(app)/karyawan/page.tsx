import { createClient } from "@/lib/supabase/server";
import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { KaryawanScreen } from "@/components/karyawan/KaryawanScreen";

export default async function KaryawanPage() {
  const employee = await requireOwnerOrAdmin();
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  return <KaryawanScreen initialEmployees={employees ?? []} currentEmployeeId={employee.id} />;
}
