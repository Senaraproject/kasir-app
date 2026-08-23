import { createClient } from "@/lib/supabase/server";
import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { LaporanScreen } from "@/components/laporan/LaporanScreen";
import { getStoreTodayRangeUtc } from "@/lib/utils/date";

export default async function LaporanPage() {
  await requireOwnerOrAdmin();
  const supabase = await createClient();

  const { from, to } = getStoreTodayRangeUtc();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, items:transaction_items(*), employee:employees(full_name), customer:customers(name)")
    .eq("status", "selesai")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false });

  return <LaporanScreen initialTransactions={transactions ?? []} />;
}
