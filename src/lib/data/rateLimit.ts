import "server-only";
import { createHash } from "node:crypto";
import { getServiceRoleClient } from "@/lib/supabase/service-client";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

/**
 * Generic IP-based rate limiter for public form submissions, backed by
 * `public_form_attempts`. Same pattern as Phase 4's result-verification
 * rate limiter (lib/data/verification.ts / result_access_attempts) —
 * factored out here since Phase 5 adds several more public forms that all
 * need the same protection.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function isFormRateLimited(formType: string, ipHash: string): Promise<boolean> {
  const supabase = getServiceRoleClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("public_form_attempts")
    .select("id", { count: "exact", head: true })
    .eq("form_type", formType)
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (error) throw error;
  return (count ?? 0) >= MAX_ATTEMPTS_PER_WINDOW;
}

export async function recordFormAttempt(formType: string, ipHash: string, succeeded: boolean): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase.from("public_form_attempts").insert({ form_type: formType, ip_hash: ipHash, succeeded });
}
