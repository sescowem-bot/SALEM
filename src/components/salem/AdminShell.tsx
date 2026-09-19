"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut, Menu, X } from "lucide-react";
import { SalemLogo } from "./Logo";
import { signOutAction } from "@/app/admin/login/actions";
import { ROLE_LABELS, type StaffRole } from "@/lib/auth/permissions";
import { useAdminLogoUrl } from "@/lib/auth/adminBrandingContext";

export interface AdminNavItem {
  href: string;
  label: string;
}

export interface AdminNavSection {
  /** Empty string for the ungrouped top item ("Overview") — rendered with no section heading. */
  label: string;
  items: AdminNavItem[];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({ sections, pathname, onNavigate }: { sections: AdminNavSection[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {sections.map((section, i) => (
        <div key={section.label || `section-${i}`}>
          {section.label ? (
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              {section.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-navy text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-accent hover:text-navy"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  children,
  eyebrow,
  title,
  lead,
  backTo = "/",
  backLabel = "Back to website",
  staffName,
  staffRole,
  navItems,
  actions,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  lead?: string;
  backTo?: string;
  backLabel?: string;
  staffName?: string;
  staffRole?: StaffRole;
  navItems?: AdminNavSection[];
  /** Optional primary action(s) (e.g. a "+ New report" button), rendered next to the page title. */
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sections = navItems ?? [];
  const logoUrl = useAdminLogoUrl();

  return (
    <div className="min-h-screen bg-secondary lg:flex">
      {/* Desktop sidebar */}
      {sections.length > 0 ? (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
          <div className="border-b border-border px-5 py-5">
            <Link href="/admin">
              <SalemLogo logoUrl={logoUrl} />
            </Link>
            <span className="mt-3 inline-flex rounded-full bg-accent px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-navy">
              Staff Area
            </span>
          </div>
          <SidebarNav sections={sections} pathname={pathname} />
          {staffName ? (
            <div className="border-t border-border p-4">
              <p className="truncate text-sm font-semibold text-navy-deep">{staffName}</p>
              {staffRole ? <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[staffRole]}</p> : null}
              <form action={signOutAction} className="mt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" /> Log out
                </button>
              </form>
            </div>
          ) : null}
        </aside>
      ) : null}

      {/* Mobile off-canvas nav */}
      {sections.length > 0 && mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-navy-deep/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link href="/admin" onClick={() => setMobileNavOpen(false)}>
                <SalemLogo logoUrl={logoUrl} />
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav sections={sections} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {sections.length > 0 ? (
                <button
                  aria-label="Open menu"
                  onClick={() => setMobileNavOpen(true)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-navy-deep lg:hidden"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
              ) : (
                <Link href="/">
                  <SalemLogo logoUrl={logoUrl} />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {staffName ? (
                <div className="hidden text-right sm:block lg:hidden">
                  <p className="text-sm font-semibold leading-tight text-navy-deep">{staffName}</p>
                  {staffRole ? (
                    <p className="text-xs leading-tight text-muted-foreground">{ROLE_LABELS[staffRole]}</p>
                  ) : null}
                </div>
              ) : null}

              {staffName ? (
                <form action={signOutAction} className="lg:hidden">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Log out</span>
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-6 lg:py-14">
          <Link
            href={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> {backLabel}
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">{eyebrow}</span>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-deep sm:text-3xl">{title}</h1>
              {lead ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{lead}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>

          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
