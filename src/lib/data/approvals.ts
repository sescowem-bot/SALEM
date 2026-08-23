import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { submitForReview, returnForCorrection, transitionReportStatus } from "./labReports";

type ApprovalRequest = Database["public"]["Tables"]["approval_requests"]["Row"];

/**
 * Data-access layer for Advanced 4 (Operations & Approval Workflow).
 *
 * This sits ON TOP of the existing report lifecycle in lib/data/labReports.ts
 * rather than replacing any of it — submitForReview/returnForCorrection/
 * transitionReportStatus are called as-is, so the draft/reviewed/published/
 * archived status machine, its version snapshots, and its own audit log
 * entries are unchanged. What's added here is the routing + decision layer:
 * a specific chosen approver per submission (approval_requests), a personal
 * Approval Queue, and Approve/Reject/Return as three distinct recorded
 * decisions instead of one generic "review" permission check.
 *
 * Every mutating function here takes an `actorRole` (from getCurrentStaff())
 * and is checked with lib/auth/permissions.ts before touching the database —
 * same defense-in-depth posture as labReports.ts, with the RLS policy in
 * supabase/migrations/20260822090001_approval_workflow.sql as the backstop.
 */

// ---------------------------------------------------------------------------
// Approver selection
// ---------------------------------------------------------------------------

export interface ApproverOption {
  id: string;
  full_name: string;
  role: StaffRole;
  designation: string | null;
}

/**
 * Active staff members whose role currently carries reports.review — the
 * only people who may legitimately be chosen as "the approver" when
 * submitting a report. Callable by anyone who can create/edit a draft, so
 * the submission form can populate its approver dropdown.
 */
export async function listApprovers(): Promise<ApproverOption[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, full_name, role, designation")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (error) throw error;

  return (data ?? []).filter((s): s is typeof s & { role: StaffRole } => hasPermission(s.role, "reports.review"));
}

// ---------------------------------------------------------------------------
// Submit for approval (staff -> chosen approver)
// ---------------------------------------------------------------------------

export async function submitReportForApproval(input: {
  labReportId: string;
  approverId: string;
  actorRole: StaffRole;
  actorId?: string;
}): Promise<ApprovalRequest> {
  if (!hasPermission(input.actorRole, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot submit a report for approval.`);
  }

  const supabase = getServiceRoleClient();

  const { data: approver, error: approverError } = await supabase
    .from("staff_profiles")
    .select("id, role, is_active")
    .eq("id", input.approverId)
    .single();
  if (approverError) throw approverError;
  if (!approver.is_active || !hasPermission(approver.role, "reports.review")) {
    throw new Error("The selected approver is not currently authorized to review reports.");
  }

  // Reuses the existing submit-for-review transition as-is (sets
  // submitted_for_review = true, writes its own RESULT_SUBMITTED_FOR_REVIEW
  // audit entry) — this function only adds the routing on top.
  await submitForReview(input.labReportId, input.actorRole, input.actorId);

  const { error: assignError } = await supabase
    .from("lab_reports")
    .update({ assigned_approver_id: input.approverId })
    .eq("id", input.labReportId);
  if (assignError) throw assignError;

  const { data: request, error: insertError } = await supabase
    .from("approval_requests")
    .insert({
      lab_report_id: input.labReportId,
      requested_by: input.actorId ?? null,
      assigned_approver_id: input.approverId,
      status: "pending",
    })
    .select()
    .single();
  if (insertError) throw insertError;

  await logAudit({
    action: "APPROVAL_REQUEST_ASSIGNED",
    entityType: "approval_requests",
    entityId: request.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    metadata: { labReportId: input.labReportId, approverId: input.approverId },
  });

  return request;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** The currently pending approval_requests row for a report, if any (at most one at a time). */
export async function getActiveApprovalRequest(labReportId: string): Promise<ApprovalRequest | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("lab_report_id", labReportId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Full approval history for a report — every submission cycle, oldest first. */
export async function getApprovalHistory(labReportId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("approval_requests")
    .select(
      "id, status, decision_comment, decided_at, created_at, requested_by:staff_profiles!approval_requests_requested_by_fkey(full_name), assigned_approver:staff_profiles!approval_requests_assigned_approver_id_fkey(full_name), decided_by_staff:staff_profiles!approval_requests_decided_by_fkey(full_name)"
    )
    .eq("lab_report_id", labReportId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * The signed-in approver's personal Approval Queue: pending requests
 * assigned specifically to them. Admin/super_admin additionally see every
 * pending request org-wide (via `includeAll`) so nothing stalls if the
 * originally-chosen approver is unavailable — a practical necessity for a
 * small lab team, still gated by the same reports.review permission.
 */
export async function listApprovalQueue(staff: { userId: string; role: StaffRole }) {
  if (!hasPermission(staff.role, "reports.review")) {
    throw new Error(`Forbidden: role "${staff.role}" cannot view the approval queue.`);
  }

  const supabase = getServiceRoleClient();
  const includeAll = staff.role === "admin" || staff.role === "super_admin";

  let query = supabase
    .from("approval_requests")
    .select(
      "id, status, created_at, assigned_approver_id, lab_reports(id, lab_number, patient_name_snapshot, status, report_tests(tests(name)))"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!includeAll) {
    query = query.eq("assigned_approver_id", staff.userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  if (!includeAll) return { mine: rows, others: [] as typeof rows };

  return {
    mine: rows.filter((r) => r.assigned_approver_id === staff.userId),
    others: rows.filter((r) => r.assigned_approver_id !== staff.userId),
  };
}

/** Staff Workspace: a staff member's own drafts and submissions, whatever their current state. */
export async function listMyReports(staff: { userId: string; role: StaffRole }) {
  if (!hasPermission(staff.role, "reports.create_draft") && !hasPermission(staff.role, "reports.edit_draft")) {
    throw new Error(`Forbidden: role "${staff.role}" has no personal report workspace.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("lab_reports")
    .select(
      "id, lab_number, patient_name_snapshot, status, submitted_for_review, report_comment, last_modified_at, assigned_approver:staff_profiles!lab_reports_assigned_approver_id_fkey(full_name)"
    )
    .eq("created_by", staff.userId)
    .order("last_modified_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Operations dashboard
// ---------------------------------------------------------------------------

/** Lightweight counts for the Operations dashboard — how the approval pipeline looks right now. */
export async function getApprovalPipelineCounts(staff: { userId: string; role: StaffRole }) {
  const supabase = getServiceRoleClient();

  const [pendingMine, pendingTotal, decidedRecent] = await Promise.all([
    supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("assigned_approver_id", staff.userId),
    hasPermission(staff.role, "reports.review")
      ? supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from("approval_requests")
      .select("status")
      .not("status", "eq", "pending")
      .order("decided_at", { ascending: false })
      .limit(100),
  ]);

  if (pendingMine.error) throw pendingMine.error;
  if (pendingTotal.error) throw pendingTotal.error;
  if (decidedRecent.error) throw decidedRecent.error;

  const recent = decidedRecent.data ?? [];
  return {
    pendingAssignedToMe: pendingMine.count ?? 0,
    pendingOrgWide: pendingTotal.count ?? 0,
    recentApproved: recent.filter((r) => r.status === "approved").length,
    recentRejected: recent.filter((r) => r.status === "rejected").length,
    recentReturned: recent.filter((r) => r.status === "returned").length,
  };
}

// ---------------------------------------------------------------------------
// Decisions: approve / reject / return
// ---------------------------------------------------------------------------

async function loadPendingRequest(requestId: string): Promise<ApprovalRequest> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("approval_requests").select("*").eq("id", requestId).single();
  if (error) throw error;
  if (data.status !== "pending") {
    throw new Error(`This approval request has already been ${data.status}.`);
  }
  return data;
}

/** An approver may act on a request if it's assigned to them, or they're admin/super_admin (oversight override). */
function assertCanDecide(request: ApprovalRequest, actorRole: StaffRole, actorId?: string) {
  if (!hasPermission(actorRole, "reports.review")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot decide on approval requests.`);
  }
  const isOverride = actorRole === "admin" || actorRole === "super_admin";
  if (!isOverride && request.assigned_approver_id !== actorId) {
    throw new Error("This request is assigned to a different approver.");
  }
}

export async function approveApprovalRequest(
  requestId: string,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  const request = await loadPendingRequest(requestId);
  assertCanDecide(request, actorRole, actorId);

  // Reuses the existing draft -> reviewed transition (writes its own
  // RESULT_APPROVED audit entry + report_versions snapshot).
  await transitionReportStatus(request.lab_report_id, "reviewed", actorId, actorRole);

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("approval_requests")
    .update({ status: "approved", decided_by: actorId ?? null, decided_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

export async function rejectApprovalRequest(
  requestId: string,
  comment: string | undefined,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  const request = await loadPendingRequest(requestId);
  assertCanDecide(request, actorRole, actorId);

  const supabase = getServiceRoleClient();
  const now = new Date().toISOString();

  const { error: requestError } = await supabase
    .from("approval_requests")
    .update({ status: "rejected", decision_comment: comment ?? null, decided_by: actorId ?? null, decided_at: now })
    .eq("id", requestId);
  if (requestError) throw requestError;

  // A reject is a harder refusal than "return for correction": the report
  // stays in draft (it was already draft while pending), but the submission
  // flag is cleared so it drops out of any queue and the staff member must
  // explicitly resubmit (choosing an approver again, possibly a different
  // one) once revised — never silently discards their entered result values.
  const { error: reportError } = await supabase
    .from("lab_reports")
    .update({
      submitted_for_review: false,
      report_comment: comment ?? null,
      last_modified_by: actorId ?? null,
      last_modified_at: now,
    })
    .eq("id", request.lab_report_id);
  if (reportError) throw reportError;

  await logAudit({
    action: "RESULT_REJECTED",
    entityType: "lab_reports",
    entityId: request.lab_report_id,
    actorId,
    actorRole,
    metadata: { approvalRequestId: requestId, comment },
  });
}

export async function returnApprovalRequestForCorrection(
  requestId: string,
  comment: string | undefined,
  actorRole: StaffRole,
  actorId?: string
): Promise<void> {
  const request = await loadPendingRequest(requestId);
  assertCanDecide(request, actorRole, actorId);

  // Reuses the existing return-for-correction logic (writes its own
  // RESULT_RETURNED audit entry, clears submitted_for_review).
  await returnForCorrection(request.lab_report_id, actorRole, comment, actorId);

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: "returned",
      decision_comment: comment ?? null,
      decided_by: actorId ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}
