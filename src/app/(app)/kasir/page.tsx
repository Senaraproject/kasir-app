import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/supabase/auth";
import { KasirScreen } from "@/components/pos/KasirScreen";

export default async function KasirPage() {
  const employee = await requireEmployee();
  const supabase = await createClient();

  const [{ data: products }, { data: categories }, { data: storeSettings }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("store_settings").select("*").eq("id", 1).single(),
  ]);

  return (
    <KasirScreen
      initialProducts={products ?? []}
      categories={categories ?? []}
      storeSettings={storeSettings}
      employee={employee}
    />
  );
}
