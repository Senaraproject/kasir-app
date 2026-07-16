import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/supabase/auth";
import { RiwayatScreen } from "@/components/riwayat/RiwayatScreen";

export default async function RiwayatPage() {
  const employee = await requireEmployee();
  const supabase = await createClient();

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, items:transaction_items(*), employee:employees(full_name), customer:customers(name)")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false });

  return (
    <RiwayatScreen
      initialTransactions={transactions ?? []}
      canCancel={employee.role === "owner" || employee.role === "admin"}
    />
  );
}
