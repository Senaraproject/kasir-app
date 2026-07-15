import { createClient } from "@/lib/supabase/server";
import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { PengaturanScreen } from "@/components/pengaturan/PengaturanScreen";

export default async function PengaturanPage() {
  await requireOwnerOrAdmin();
  const supabase = await createClient();
  const { data: storeSettings } = await supabase.from("store_settings").select("*").eq("id", 1).single();

  return <PengaturanScreen initialSettings={storeSettings} />;
}
