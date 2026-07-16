import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/supabase/auth";
import { MemberScreen } from "@/components/member/MemberScreen";

export default async function MemberPage() {
  await requireEmployee();
  const supabase = await createClient();

  const { data: customers } = await supabase.from("customers").select("*").order("name");

  return <MemberScreen initialCustomers={customers ?? []} />;
}
