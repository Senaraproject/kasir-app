import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/supabase/auth";
import { ProdukScreen } from "@/components/produk/ProdukScreen";

export default async function ProdukPage() {
  const employee = await requireEmployee();
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, category:categories(*)").order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <ProdukScreen
      initialProducts={products ?? []}
      initialCategories={categories ?? []}
      canManage={employee.role === "owner" || employee.role === "admin"}
    />
  );
}
