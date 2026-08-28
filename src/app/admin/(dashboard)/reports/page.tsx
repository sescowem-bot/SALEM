import type { Metadata } from "next";
import Link from "next/link";
import { Search, FileText, Plus } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllReports } from "@/lib/data/labReports";
import type { ReportStatus } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports | Salem Staff Area",
  robots: { index: false, follow: false },
};

const STATUS_FILTERS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "reviewed", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function ReportsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);
  const { q, status } = await searchParams;

  if (!can(staff, "reports.view")) {
    return (
      <AdminShell eyebrow="Results System" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to laboratory reports.
        </p>
      </AdminShell>
    );
  }

  const activeStatus = (status as ReportStatus | "all" | undefined) ?? "all";
  const reports = await listAllReports(staff.role, { query: q, status: activeStatus });
  const canCreate = can(staff, "reports.create_draft");

  return (
    <AdminShell
      eyebrow="Results System · Staff Area"
      title="Reports"
      lead={`${reports.length} report${reports.length === 1 ? "" : "s"} · search by patient name or lab number.`}
      backTo="/admin/operations"
      backLabel="Back to operations"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
      actions={
        canCreate ? (
          <Link
            href="/admin/results-entry"
            className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-navy-deep"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> New report
          </Link>
        ) : undefined
      }
    >
      <div className="surface-card mb-6 p-4 sm:p-5">
        <form className="flex flex-wrap items-center gap-3" action="/admin/reports">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search patient name or lab number…"
              className="w-full rounded-full border border-border bg-secondary py-2 pl-9 pr-4 text-sm outline-none focus:border-cyan focus:bg-card"
            />
          </div>
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <button type="submit" className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-primary-foreground">
            Search
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={{ pathname: "/admin/reports", query: { ...(q ? { q } : {}), ...(f.value === "all" ? {} : { status: f.value }) } }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                activeStatus === f.value ? "border-navy bg-navy text-primary-foreground" : "border-border text-navy hover:bg-accent"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="surface-card overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Lab number</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Approver</th>
              <th className="px-3 py-2">Report reference</th>
              <th className="px-3 py-2">Delivery</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.map((r) => {
              const joined = r as unknown as { assigned_approver: { full_name: string } | null };
              return (
                <tr key={r.id} className="hover:bg-secondary/60">
                  <td className="px-3 py-2.5 font-medium text-navy-deep">{r.patient_name_snapshot}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.lab_number}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={r.status} />
                      {r.status === "draft" && r.submitted_for_review ? <StatusBadge status="pending" label="Submitted" /> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{joined.assigned_approver?.full_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.result_reference ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {r.status === "published" && r.access_code_hash ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Available to patient
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        Not yet available
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/reports/${r.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"
                    >
                      <FileText className="h-3.5 w-3.5" /> Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No reports match this search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
