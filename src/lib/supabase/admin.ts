import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Client dengan service role key. HANYA boleh dipakai di server (Server Actions/Route Handlers), tidak pernah di browser. */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
