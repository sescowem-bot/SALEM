import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAppointmentRequests } from "@/lib/data/appointments";
import { AppointmentStatusForm } from "./AppointmentStatusForm";

export const metadata: Metadata = {
  title: "Appointments | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function AppointmentsPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "appointments.manage")) {
    return (
      <AdminShell eyebrow="Bookings" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to appointment requests.
        </p>
      </AdminShell>
    );
  }

  const requests = await listAppointmentRequests(staff.role);

  return (
    <AdminShell
      eyebrow="Bookings · Staff Area"
      title="Appointment requests"
      lead={`${requests.length} booking${requests.length === 1 ? "" : "s"} · most recent first.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {requests.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No appointment requests yet.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy-deep">{r.full_name}</span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {r.phone} · {r.preferred_date ?? "—"} {r.preferred_time ?? ""} ·{" "}
                    {r.location_type === "home" ? "Home collection" : "Walk-in"}
                  </span>
                  {r.test_or_package ? (
                    <span className="block text-xs text-muted-foreground">{r.test_or_package}</span>
                  ) : null}
                  {r.booking_reference ? (
                    <span className="block font-mono text-[0.65rem] text-muted-foreground">{r.booking_reference}</span>
                  ) : null}
                </span>
              </span>
              <AppointmentStatusForm requestId={r.id} status={r.status} />
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
