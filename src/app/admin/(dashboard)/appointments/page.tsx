import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAppointmentRequests } from "@/lib/data/appointments";
import { AppointmentStatusForm } from "./AppointmentStatusForm";
import { AppointmentRescheduleForm } from "./AppointmentRescheduleForm";
import { CreateAppointmentForm } from "./CreateAppointmentForm";

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
      actions={<CreateAppointmentForm />}
    >
      {requests.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No appointment requests yet.</p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
              <span className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy-deep">{r.full_name}</span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {r.phone} · Requested: {r.preferred_date ?? "—"} {r.preferred_time ?? ""} ·{" "}
                    {r.location_type === "home" ? "Home collection" : "Walk-in"}
                  </span>
                  {r.rescheduled_date ? (
                    <span className="block text-xs font-medium text-purple">
                      Rescheduled to: {r.rescheduled_date} {r.rescheduled_time ?? ""}
                    </span>
                  ) : null}
                  {r.test_or_package ? (
                    <span className="block text-xs text-muted-foreground">{r.test_or_package}</span>
                  ) : null}
                  {r.notes ? (
                    <span className="block text-xs text-muted-foreground">Patient notes: {r.notes}</span>
                  ) : null}
                  {r.admin_notes ? (
                    <span className="block text-xs font-medium text-navy-deep">Staff notes: {r.admin_notes}</span>
                  ) : null}
                  {r.booking_reference ? (
                    <span className="block font-mono text-[0.65rem] text-muted-foreground">{r.booking_reference}</span>
                  ) : null}
                </span>
              </span>
              <div className="flex flex-col items-end gap-2">
                <AppointmentStatusForm requestId={r.id} status={r.status} />
                <AppointmentRescheduleForm
                  requestId={r.id}
                  rescheduledDate={r.rescheduled_date}
                  rescheduledTime={r.rescheduled_time}
                  adminNotes={r.admin_notes}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
