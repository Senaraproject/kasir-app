import { requireEmployee } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireEmployee();
  const supabase = await createClient();
  const { data: storeSettings } = await supabase
    .from("store_settings")
    .select("store_name")
    .eq("id", 1)
    .single();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={employee.role} fullName={employee.full_name} storeName={storeSettings?.store_name ?? null} />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">{children}</main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
