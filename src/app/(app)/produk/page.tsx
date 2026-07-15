import { createClient } from "@/lib/supabase/server";
import { requireOwnerOrAdmin } from "@/lib/supabase/auth";
import { ProdukScreen } from "@/components/produk/ProdukScreen";

export default async function ProdukPage() {
  await requireOwnerOrAdmin();
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, category:categories(*)").order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return <ProdukScreen initialProducts={products ?? []} initialCategories={categories ?? []} />;
}
