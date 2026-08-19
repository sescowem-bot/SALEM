import type { AdminNavItem } from "@/components/salem/AdminShell";
import { can, type CurrentStaff } from "./session";

/**
 * Nav items are filtered by permission, not just visually hidden — a role
 * without a link here also can't do anything useful on that route (see the
 * page-level checks in each route + the RLS/permission checks in
 * lib/data/*), so this is a convenience, not the enforcement itself.
 */
export function getAdminNavItems(staff: CurrentStaff): AdminNavItem[] {
  const items: AdminNavItem[] = [{ href: "/admin", label: "Overview" }];

  if (can(staff, "reports.view")) {
    items.push({ href: "/admin/results-entry", label: "Results" });
  }

  if (can(staff, "reports.review")) {
    items.push({ href: "/admin/review", label: "Review queue" });
  }

  return items;
}
