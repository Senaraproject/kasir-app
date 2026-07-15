import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/supabase/auth";
import { RiwayatScreen } from "@/components/riwayat/RiwayatScreen";

export default async function RiwayatPage() {
  const employee = await requireEmployee();
  const supabase = await createClient();

  const from = new Date();
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, items:transaction_items(*), employee:employees(full_name)")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false });

  return (
    <RiwayatScreen
      initialTransactions={transactions ?? []}
      canCancel={employee.role === "owner" || employee.role === "admin"}
    />
  );
}
