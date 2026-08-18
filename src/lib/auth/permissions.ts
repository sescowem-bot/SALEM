/**
 * RBAC permission matrix — pure logic, no I/O, safe to import anywhere
 * (server or client) purely for reading permission constants, though actual
 * enforcement only happens where this is combined with a verified session
 * (see lib/auth/session.ts, which is server-only).
 *
 * This mirrors the RLS policies in
 * supabase/migrations/20260817090002_rbac_rls_policies.sql at the table
 * level. Two gaps RLS can't express at the row level are enforced here
 * instead:
 *  - who may transition a report to "reviewed"/"published"/"archived"
 *    (laboratory_staff can author a draft but not approve/publish it)
 *  - staff management (create/deactivate staff) is super_admin only
 *
 * Both layers exist deliberately: RLS is the last line of defence if a
 * request ever reaches Postgres directly; these checks give a fast, clear
 * rejection before that, per "enforce permissions on the server ... not
 * just by hiding UI buttons."
 */

export type StaffRole =
  | "super_admin"
  | "admin"
  | "laboratory_staff"
  | "pathologist"
  | "phlebotomist"
  | "frontdesk";

export const STAFF_ROLES: StaffRole[] = [
  "super_admin",
  "admin",
  "laboratory_staff",
  "pathologist",
  "phlebotomist",
  "frontdesk",
];

export type Permission =
  | "staff.manage"
  | "patients.register"
  | "patients.view"
  | "patients.update"
  | "reports.view"
  | "reports.create_draft"
  | "reports.edit_draft"
  | "reports.review"
  | "reports.publish"
  | "reports.archive"
  | "appointments.manage"
  | "home_collection.manage"
  | "home_collection.view_assigned"
  | "home_collection.update_status"
  | "catalogue.manage"
  | "analytics.view"
  | "audit.view"
  | "settings.manage"
  | "enquiries.manage";

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: [
    "staff.manage",
    "patients.register",
    "patients.view",
    "patients.update",
    "reports.view",
    "reports.create_draft",
    "reports.edit_draft",
    "reports.review",
    "reports.publish",
    "reports.archive",
    "appointments.manage",
    "home_collection.manage",
    "catalogue.manage",
    "analytics.view",
    "audit.view",
    "settings.manage",
    "enquiries.manage",
  ],
  admin: [
    // Everything super_admin has except staff.manage and settings.manage.
    "patients.register",
    "patients.view",
    "patients.update",
    "reports.view",
    "reports.create_draft",
    "reports.edit_draft",
    "reports.review",
    "reports.publish",
    "reports.archive",
    "appointments.manage",
    "home_collection.manage",
    "catalogue.manage",
    "analytics.view",
    "audit.view",
    "enquiries.manage",
  ],
  pathologist: ["patients.view", "reports.view", "reports.review", "reports.publish"],
  laboratory_staff: [
    "patients.register",
    "patients.view",
    "reports.view",
    "reports.create_draft",
    "reports.edit_draft",
  ],
  frontdesk: ["patients.register", "patients.view", "appointments.manage", "enquiries.manage"],
  phlebotomist: ["home_collection.view_assigned", "home_collection.update_status"],
};

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Maps a lab_reports status transition to the permission required to
 * perform it. Used to gate lib/data/labReports.ts `transitionReportStatus`
 * calls at the call site — RLS grants laboratory_staff UPDATE on
 * lab_reports at the table level (they need it to edit drafts), but only
 * this app-layer check stops them from moving a report to "published".
 */
export function permissionForReportTransition(toStatus: "reviewed" | "published" | "archived"): Permission {
  if (toStatus === "reviewed") return "reports.review";
  if (toStatus === "published") return "reports.publish";
  return "reports.archive";
}

export function getPermissionsForRole(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  laboratory_staff: "Laboratory Staff",
  pathologist: "Pathologist",
  phlebotomist: "Phlebotomist",
  frontdesk: "Front Desk",
};
