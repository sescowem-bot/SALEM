import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type Signatory = Database["public"]["Tables"]["signatories"]["Row"];

/**
 * Data-access layer for the `signatories` table (Phase 2B) plus the
 * staff_profile_id link added in Advanced 4. Advanced 4 only added the
 * column and reserved this stage for the admin-managed linking — this file
 * is that stage: CRUD, active/inactive listing, and the resolver Advanced 5
 * document generation (lib/data/reportDocuments.ts) uses to turn an
 * approver (staff_profiles.id) into their stored signature image.
 *
 * Every mutating function is gated by "documents.manage" (super_admin
 * only), matching the RLS "admins manage signatories" policy from
 * supabase/migrations/20260817090002_rbac_rls_policies.sql (which allows
 * both super_admin and admin at the table level — this app-layer check is
 * the tighter gate the ticket asks for: "Super Admin should be able to
 * manage/link ...").
 */

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

/** Admin management screen — includes inactive signatories, unlike listActiveSignatories. */
export async function listAllSignatories(actorRole: StaffRole): Promise<Signatory[]> {
  if (!hasPermission(actorRole, "documents.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view signatory records.`);
  }
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("signatories").select("*").order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Resolves an approver (staff_profiles.id, e.g. approval_requests.assigned_approver_id)
 * to their linked, active signatory record — or null if that staff member
 * has no signatory link, isn't active, or has no signature image on file.
 * Used exclusively by the final-PDF generator (lib/data/reportDocuments.ts)
 * so an approval never attaches a signature that wasn't explicitly linked
 * by a Super Admin to that specific staff login.
 */
export async function resolveSignatoryForStaff(staffProfileId: string): Promise<Signatory | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("signatories")
    .select("*")
    .eq("staff_profile_id", staffProfileId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface SignatoryInput {
  fullName: string;
  qualification?: string | null;
  designation?: string | null;
  staffProfileId?: string | null;
  isActive?: boolean;
}

export async function createSignatory(
  input: SignatoryInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<Signatory> {
  if (!hasPermission(actorRole, "documents.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot create a signatory.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("signatories")
    .insert({
      full_name: input.fullName,
      qualification: input.qualification ?? null,
      designation: input.designation ?? null,
      staff_profile_id: input.staffProfileId ?? null,
      is_active: input.isActive ?? true,
    })
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "SIGNATORY_CREATED",
    entityType: "signatories",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { fullName: input.fullName, staffProfileId: input.staffProfileId ?? null },
  });

  return data;
}

export async function updateSignatory(
  signatoryId: string,
  input: SignatoryInput,
  actorRole: StaffRole,
  actorId?: string
): Promise<Signatory> {
  if (!hasPermission(actorRole, "documents.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot update a signatory.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("signatories")
    .update({
      full_name: input.fullName,
      qualification: input.qualification ?? null,
      designation: input.designation ?? null,
      staff_profile_id: input.staffProfileId ?? null,
      is_active: input.isActive ?? true,
    })
    .eq("id", signatoryId)
    .select()
    .single();
  if (error) throw error;

  await logAudit({
    action: "SIGNATORY_UPDATED",
    entityType: "signatories",
    entityId: signatoryId,
    actorId,
    actorRole,
    metadata: { fullName: input.fullName, staffProfileId: input.staffProfileId ?? null, isActive: input.isActive },
  });

  return data;
}
