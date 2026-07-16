import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/supabase/auth";
import { RiwayatScreen } from "@/components/riwayat/RiwayatScreen";
import { getStoreTodayRangeUtc } from "@/lib/utils/date";

export default async function RiwayatPage() {
  const employee = await requireEmployee();
  const supabase = await createClient();

  const { from, to } = getStoreTodayRangeUtc();

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
