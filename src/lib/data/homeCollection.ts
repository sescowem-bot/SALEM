import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type HomeCollectionRequest = Database["public"]["Tables"]["home_collection_requests"]["Row"];
type HomeCollectionStatus = Database["public"]["Tables"]["home_collection_requests"]["Row"]["status"];

/**
 * This uses the service-role client, which bypasses RLS entirely — unlike
 * the RLS policies added in migration 20260819090001 (which scope a
 * phlebotomist session to their own assigned rows), THIS function must
 * enforce that same scoping in application code, since RLS provides no
 * protection here. super_admin/admin (home_collection.manage) see
 * everything; phlebotomist (home_collection.view_assigned) sees only rows
 * assigned to their own staff id.
 */
export async function listHomeCollectionRequests(
  actorRole: StaffRole,
  actorId?: string
): Promise<HomeCollectionRequest[]> {
  const supabase = getServiceRoleClient();

  if (hasPermission(actorRole, "home_collection.manage")) {
    const { data, error } = await supabase
      .from("home_collection_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  if (hasPermission(actorRole, "home_collection.view_assigned")) {
    if (!actorId) return [];
    const { data, error } = await supabase
      .from("home_collection_requests")
      .select("*")
      .eq("assigned_phlebotomist_id", actorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  throw new Error(`Forbidden: role "${actorRole}" cannot view home collection requests.`);
}

export async function updateHomeCollectionStatus(
  requestId: string,
  status: HomeCollectionStatus,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  const supabase = getServiceRoleClient();

  if (hasPermission(actorRole, "home_collection.manage")) {
    // full access, no ownership check
  } else if (hasPermission(actorRole, "home_collection.update_status")) {
    const { data: existing, error: fetchError } = await supabase
      .from("home_collection_requests")
      .select("assigned_phlebotomist_id")
      .eq("id", requestId)
      .single();
    if (fetchError) throw fetchError;
    if (existing.assigned_phlebotomist_id !== actorId) {
      throw new Error("Forbidden: this request is not assigned to you.");
    }
  } else {
    throw new Error(`Forbidden: role "${actorRole}" cannot update home collection requests.`);
  }

  if (["confirmed", "assigned", "in_progress"].includes(status)) {
    const [{ data: request, error: requestError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from("home_collection_requests").select("payment_status").eq("id", requestId).single(),
      supabase.from("site_settings").select("home_collection_payment_required").eq("id", true).single(),
    ]);
    if (requestError) throw requestError;
    if (settingsError) throw settingsError;
    if (settings?.home_collection_payment_required && request.payment_status !== "paid" && request.payment_status !== "waived") {
      throw new Error("Payment must be verified before the home-collection visit can be confirmed or dispatched.");
    }
  }

  const { error } = await supabase.from("home_collection_requests").update({ status }).eq("id", requestId);
  if (error) throw error;

  await logAudit({
    action: "HOME_COLLECTION_STATUS_UPDATED",
    entityType: "home_collection_requests",
    entityId: requestId,
    actorId,
    actorRole,
    metadata: { status },
  });
}

/**
 * Admin-controlled payment tracking. Deliberately just a status + optional
 * free text — no payment gateway wired in and no single workflow assumed,
 * per the requirement that payment be admin-controlled without hardcoding
 * one path (cash on visit, bank transfer, waived, etc. are all just notes).
 */
export async function updateHomeCollectionPayment(
  requestId: string,
  input: { paymentStatus: "unpaid" | "pending" | "paid" | "waived"; paymentAmountNgn?: number | null; paymentNotes?: string },
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "home_collection.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot update payment for home collection requests.`);
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("home_collection_requests")
    .update({
      payment_status: input.paymentStatus,
      payment_amount_ngn: input.paymentAmountNgn ?? null,
      payment_notes: input.paymentNotes || null,
    })
    .eq("id", requestId);
  if (error) throw error;

  await logAudit({
    action: "HOME_COLLECTION_PAYMENT_UPDATED",
    entityType: "home_collection_requests",
    entityId: requestId,
    actorId,
    actorRole,
    metadata: { paymentStatus: input.paymentStatus },
  });
}

export async function assignPhlebotomist(
  requestId: string,
  phlebotomistId: string,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  if (!hasPermission(actorRole, "home_collection.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot assign home collection requests.`);
  }

  const supabase = getServiceRoleClient();
  const [{ data: request, error: requestError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("home_collection_requests").select("payment_status").eq("id", requestId).single(),
    supabase.from("site_settings").select("home_collection_payment_required").eq("id", true).single(),
  ]);
  if (requestError) throw requestError;
  if (settingsError) throw settingsError;
  if (settings?.home_collection_payment_required && request.payment_status !== "paid" && request.payment_status !== "waived") {
    throw new Error("Payment must be verified before a home-collection visit can be assigned.");
  }

  const { error } = await supabase
    .from("home_collection_requests")
    .update({ assigned_phlebotomist_id: phlebotomistId, status: "assigned" })
    .eq("id", requestId);
  if (error) throw error;

  await logAudit({
    action: "HOME_COLLECTION_ASSIGNED",
    entityType: "home_collection_requests",
    entityId: requestId,
    actorId,
    actorRole,
    metadata: { phlebotomistId },
  });
}

export async function listActivePhlebotomists(actorRole: StaffRole) {
  if (!hasPermission(actorRole, "home_collection.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view the phlebotomist list.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, full_name")
    .eq("role", "phlebotomist")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
