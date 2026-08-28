import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { AdminBrandingProvider } from "@/lib/auth/adminBrandingContext";

/**
 * Second layer of route protection behind middleware.ts (which already
 * redirects unauthenticated requests before this ever renders). This layer
 * additionally makes the current staff member available to every page
 * under this route group via requireStaff()/getCurrentStaff() — each page
 * calls it directly rather than via React context, since Server Components
 * can just await it.
 *
 * The real site logo is fetched here (once, server-side) and provided via
 * AdminBrandingProvider so AdminShell.tsx — a Client Component rendered
 * from ~20 different pages — can show the actual uploaded Salem logo
 * instead of the built-in placeholder mark it previously always fell back
 * to (Advanced 7 QA §1).
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireStaff();

  let logoUrl: string | null = null;
  try {
    const settings = await getSiteSettings();
    logoUrl = settings.logoUrl;
  } catch {
    // Never let a settings-fetch hiccup break the admin area — fall back
    // to the placeholder mark, same posture as the public root layout.
  }

  return <AdminBrandingProvider logoUrl={logoUrl}>{children}</AdminBrandingProvider>;
}
