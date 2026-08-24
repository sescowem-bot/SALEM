import type { AdminNavItem, AdminNavSection } from "@/components/salem/AdminShell";
import { can, type CurrentStaff } from "./session";

/**
 * Nav items are filtered by permission, not just visually hidden — a role
 * without a link here also can't do anything useful on that route (see the
 * page-level checks in each route + the RLS/permission checks in
 * lib/data/*), so this is a convenience, not the enforcement itself.
 *
 * Grouped into sections per Advanced 1 §1 (Operations / Services /
 * Communications / Administration). "Content / Website" from the ticket's
 * proposed IA collapses into a single Settings entry under Administration
 * for now — there is no CMS-backed homepage/services-content table yet
 * (see /admin/settings for the read-only foundation), so a separate
 * section with nothing behind most of its links would just be dead UI.
 */
export function getAdminNavItems(staff: CurrentStaff): AdminNavSection[] {
  const sections: AdminNavSection[] = [
    { label: "", items: [{ href: "/admin", label: "Overview" }] },
  ];

  const operations: AdminNavItem[] = [];
  if (can(staff, "reports.view")) {
    operations.push({ href: "/admin/operations", label: "Operations dashboard" });
  }
  if (can(staff, "patients.view")) {
    operations.push({ href: "/admin/patients", label: "Patients" });
  }
  if (can(staff, "appointments.manage")) {
    operations.push({ href: "/admin/appointments", label: "Appointments" });
  }
  if (can(staff, "home_collection.manage") || can(staff, "home_collection.view_assigned")) {
    operations.push({ href: "/admin/home-collection", label: "Home collection" });
  }
  if (can(staff, "reports.view")) {
    operations.push({ href: "/admin/results-entry", label: "Results entry" });
  }
  if (can(staff, "reports.view")) {
    operations.push({ href: "/admin/reports", label: "Reports" });
  }
  if (can(staff, "reports.create_draft") || can(staff, "reports.edit_draft")) {
    operations.push({ href: "/admin/workspace", label: "My workspace" });
  }
  if (can(staff, "reports.review")) {
    operations.push({ href: "/admin/review", label: "Approval queue" });
  }
  if (operations.length > 0) sections.push({ label: "Operations", items: operations });

  const services: AdminNavItem[] = [];
  if (can(staff, "catalogue.manage")) {
    services.push({ href: "/admin/services", label: "Services" });
  }
  if (services.length > 0) sections.push({ label: "Services", items: services });

  const communications: AdminNavItem[] = [];
  if (can(staff, "enquiries.manage")) {
    communications.push({ href: "/admin/messages", label: "Contact messages" });
  }
  if (communications.length > 0) sections.push({ label: "Communications", items: communications });

  const administration: AdminNavItem[] = [];
  const canViewStaffDirectory = can(staff, "staff.manage") || staff.role === "admin";
  if (canViewStaffDirectory) {
    administration.push({ href: "/admin/staff", label: "Staff" });
  }
  if (can(staff, "staff.manage")) {
    administration.push({ href: "/admin/roles", label: "Roles & permissions" });
  }
  if (can(staff, "audit.view")) {
    administration.push({ href: "/admin/audit", label: "Audit logs" });
  }
  if (can(staff, "audit.view")) {
    administration.push({ href: "/admin/notifications", label: "Notifications" });
  }
  if (can(staff, "documents.manage")) {
    administration.push({ href: "/admin/signatories", label: "Report signatories" });
  }
  if (administration.length > 0) sections.push({ label: "Administration", items: administration });

  const website: AdminNavItem[] = [];
  if (can(staff, "settings.manage")) {
    website.push(
      { href: "/admin/website", label: "Overview" },
      { href: "/admin/website/homepage", label: "Homepage" },
      { href: "/admin/website/about", label: "About" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/website/contact", label: "Contact" },
      { href: "/admin/website/footer", label: "Footer" },
      { href: "/admin/website/seo", label: "SEO" },
      { href: "/admin/settings", label: "Brand / Settings" }
    );
  }
  if (website.length > 0) sections.push({ label: "Website", items: website });

  return sections;
}
