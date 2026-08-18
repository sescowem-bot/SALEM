import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth/session";

/**
 * Second layer of route protection behind middleware.ts (which already
 * redirects unauthenticated requests before this ever renders). This layer
 * additionally makes the current staff member available to every page
 * under this route group via requireStaff()/getCurrentStaff() — each page
 * calls it directly rather than via React context, since Server Components
 * can just await it.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireStaff();
  return <>{children}</>;
}
