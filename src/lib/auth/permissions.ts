/**
 * RBAC vocabulary — pure data, no I/O, safe to import anywhere (server or
 * client). This is the catalogue of roles and permission *keys* the app
 * knows how to enforce: each permission below gates a specific check at a
 * specific call site (grep the key to find it). Adding a new permission
 * here means also adding the enforcement check at its call site(s) and
 * adding it to the `permission` check constraint in
 * supabase/migrations/20260919090001_role_permissions.sql.
 *
 * *Which* role holds which permission is no longer hardcoded here — it's
 * data in the role_permissions table, editable from /admin/roles by
 * super_admin, and read at request time by ./rolePermissions.ts (the
 * server-only, DB-backed counterpart to this file). DEFAULT_ROLE_PERMISSIONS
 * below is kept only as (a) the value the seed migration was populated
 * with and (b) a fail-safe fallback if the DB read ever errors — it is not
 * consulted on the normal path.
 *
 * This mirrors the RLS policies in
 * supabase/migrations/20260817090002_rbac_rls_policies.sql at the table
 * level. Two gaps RLS can't express at the row level are enforced in the
 * app layer instead:
 *  - who may transition a report to "reviewed"/"published"/"archived"
 *    (laboratory_staff can author a draft but not approve/publish it)
 *  - staff management (create/deactivate staff) and editing the permission
 *    matrix itself are super_admin only, never delegable via this table
 *    (see role_permissions' RLS policy and rolePermissions.ts)
 *
 * Both layers exist deliberately: RLS is the last line of defence if a
 * request ever reaches Postgres directly; these checks give a fast, clear
 * rejection before that.
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

/**
 * The full catalogue of permission keys, and the single source of truth
 * for the `Permission` type (derived from this array so the type and the
 * runtime list can never drift apart).
 */
export const ALL_PERMISSIONS = [
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
  "home_collection.view_assigned",
  "home_collection.update_status",
  "catalogue.manage",
  "analytics.view",
  "audit.view",
  "settings.manage",
  "enquiries.manage",
  // Advanced 5 — managing signatories (linking a staff login to a stored
  // signature image used on final report PDFs). Deliberately its own
  // permission rather than reusing staff.manage — it gates a distinct
  // action — attaching a signature to an identity — that shouldn't
  // silently widen if staff.manage is ever extended to another role.
  "documents.manage",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

/** Short human-readable label for each permission, for the /admin/roles UI. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "staff.manage": "Create, edit and deactivate staff logins",
  "patients.register": "Register new patients",
  "patients.view": "View patient records",
  "patients.update": "Edit patient records",
  "reports.view": "View lab reports",
  "reports.create_draft": "Create draft reports",
  "reports.edit_draft": "Edit draft reports",
  "reports.review": "Review reports (approve/reject/return)",
  "reports.publish": "Publish reports to patients",
  "reports.archive": "Archive reports",
  "appointments.manage": "Manage appointment bookings",
  "home_collection.manage": "Manage home collection requests & assignments",
  "home_collection.view_assigned": "View home collection jobs assigned to them",
  "home_collection.update_status": "Update status of an assigned home collection job",
  "catalogue.manage": "Manage the services/investigations catalogue",
  "analytics.view": "View site analytics",
  "audit.view": "View the audit log",
  "settings.manage": "Manage site/org settings and the website CMS",
  "enquiries.manage": "Manage contact-form enquiries",
  "documents.manage": "Manage signatories & report signatures",
};

/** Groups permissions by resource area, for a tidier /admin/roles layout. */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: "Staff", permissions: ["staff.manage"] },
  { label: "Patients", permissions: ["patients.register", "patients.view", "patients.update"] },
  {
    label: "Reports",
    permissions: [
      "reports.view",
      "reports.create_draft",
      "reports.edit_draft",
      "reports.review",
      "reports.publish",
      "reports.archive",
    ],
  },
  { label: "Appointments", permissions: ["appointments.manage"] },
  {
    label: "Home collection",
    permissions: ["home_collection.manage", "home_collection.view_assigned", "home_collection.update_status"],
  },
  { label: "Services catalogue", permissions: ["catalogue.manage"] },
  { label: "Website & settings", permissions: ["settings.manage", "documents.manage"] },
  { label: "Communications", permissions: ["enquiries.manage"] },
  { label: "Reporting", permissions: ["analytics.view", "audit.view"] },
];

/**
 * The matrix this app shipped with before the permission matrix became
 * editable. Used only to seed the role_permissions table and as an
 * in-memory fallback if the DB read in rolePermissions.ts ever errors —
 * never consulted on the normal request path. super_admin is deliberately
 * absent: it is treated as "all permissions" unconditionally in
 * rolePermissions.ts, regardless of what is (or isn't) in the database.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  admin: [
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
    "documents.manage",
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

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  laboratory_staff: "Laboratory Staff",
  pathologist: "Pathologist",
  phlebotomist: "Phlebotomist",
  frontdesk: "Front Desk",
};
