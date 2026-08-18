import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";

type Signatory = Database["public"]["Tables"]["signatories"]["Row"];

export async function listActiveSignatories(): Promise<Signatory[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("signatories")
    .select("*")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
