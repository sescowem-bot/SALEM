import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { SalemLogo } from "./Logo";
import { signOutAction } from "@/app/admin/login/actions";
import { ROLE_LABELS, type StaffRole } from "@/lib/auth/permissions";

export interface AdminNavItem {
  href: string;
  label: string;
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
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  lead?: string;
  backTo?: string;
  backLabel?: string;
  staffName?: string;
  staffRole?: StaffRole;
  navItems?: AdminNavItem[];
}) {
  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/">
            <SalemLogo />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {staffName ? (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-navy-deep">{staffName}</p>
                {staffRole ? (
                  <p className="text-xs leading-tight text-muted-foreground">{ROLE_LABELS[staffRole]}</p>
                ) : null}
              </div>
            ) : null}

            <span className="hidden rounded-full bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-navy sm:inline-flex">
              Staff Area
            </span>

            {staffName ? (
              <form action={signOutAction}>
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

        {navItems && navItems.length > 0 ? (
          <nav className="border-t border-border">
            <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-5 py-2 sm:px-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-navy"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-14">
        <Link
          href={backTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" /> {backLabel}
        </Link>

        <div className="mt-4 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
            {eyebrow}
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-deep sm:text-3xl">
            {title}
          </h1>
          {lead ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {lead}
            </p>
          ) : null}
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
