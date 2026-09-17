"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Bridges the real site logo (fetched server-side from `site_settings` in
 * src/app/admin/(dashboard)/layout.tsx) down to AdminShell.tsx, which is a
 * Client Component and can't fetch it itself. Fixes the admin area
 * permanently showing the built-in placeholder mark instead of whatever
 * logo has been uploaded in Admin > Settings, without needing to thread a
 * `logoUrl` prop through every one of the ~20 admin pages that render
 * AdminShell.
 */
const AdminBrandingContext = createContext<{ logoUrl: string | null }>({ logoUrl: null });

export function AdminBrandingProvider({ logoUrl, children }: { logoUrl: string | null; children: ReactNode }) {
  return <AdminBrandingContext.Provider value={{ logoUrl }}>{children}</AdminBrandingContext.Provider>;
}

export function useAdminLogoUrl(): string | null {
  return useContext(AdminBrandingContext).logoUrl;
}
