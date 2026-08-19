import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { AuditAction, StaffRoleDb } from "@/lib/supabase/database.types";

/**
 * Append-only audit trail. Always written via the service-role client — an
 * ordinary staff RLS-scoped write path is deliberately not offered (see the
 * migration comment on audit_logs); this mirrors how report_versions is
 * written in lib/data/labReports.ts. Call this from every sensitive action
 * listed in Phase 4 §Audit, right after the underlying write succeeds.
 */
export async function logAudit(entry: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorRole?: StaffRoleDb;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("audit_logs").insert({
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    metadata: entry.metadata ?? {},
  });

  // Audit logging failure should never silently break the underlying
  // operation it's describing (which has already committed), but it must
  // not be swallowed either — surface it loudly to server logs.
  if (error) {
    console.error("[audit] failed to write audit log", entry.action, error);
  }
}

export async function listAuditLogs(filters?: { entityType?: string; entityId?: string; limit?: number }) {
  const supabase = getServiceRoleClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters?.entityId) query = query.eq("entity_id", filters.entityId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
