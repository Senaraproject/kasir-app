import { createClient } from "@/lib/supabase/server";
import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { LaporanScreen } from "@/components/laporan/LaporanScreen";

export default async function LaporanPage() {
  await requireOwnerOrAdmin();
  const supabase = await createClient();

  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, items:transaction_items(*), employee:employees(full_name), customer:customers(name)")
    .eq("status", "selesai")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false });

  return <LaporanScreen initialTransactions={transactions ?? []} />;
}
