import { requireEmployee } from "@/lib/supabase/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireEmployee();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={employee.role} fullName={employee.full_name} />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">{children}</main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
