/**
 * Shared status badge for the admin UI. Every status vocabulary in this app
 * (report workflow, appointment intake, home-collection workflow) is a
 * small closed set of strings — this centralizes their color mapping so new
 * admin screens don't reinvent ad-hoc text labels, and so the same status
 * always looks the same everywhere it appears.
 */
const STATUS_STYLES: Record<string, string> = {
  // Report workflow (lab_reports.status)
  draft: "bg-secondary text-muted-foreground border-border",
  reviewed: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-secondary text-muted-foreground border-border",
  // Appointment / contact intake (intake_status)
  new: "bg-cyan/15 text-navy-deep border-cyan/40",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  scheduled: "bg-purple/10 text-purple border-purple/30",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  // Home collection workflow (home_collection_status)
  pending: "bg-cyan/15 text-navy-deep border-cyan/40",
  confirmed: "bg-amber-50 text-amber-700 border-amber-200",
  assigned: "bg-purple/10 text-purple border-purple/30",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${style}`}
    >
      {label ?? status.replace("_", " ")}
    </span>
  );
}
