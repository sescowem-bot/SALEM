import type { Metadata } from "next";
import { Home, MapPin, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { StatusBadge } from "@/components/salem/StatusBadge";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listHomeCollectionRequests, listActivePhlebotomists } from "@/lib/data/homeCollection";
import { HomeCollectionStatusForm, AssignPhlebotomistForm, HomeCollectionPaymentForm } from "./HomeCollectionForms";

export const metadata: Metadata = {
  title: "Home Collection | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function HomeCollectionPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  const canManage = can(staff, "home_collection.manage");
  const canViewAssigned = can(staff, "home_collection.view_assigned");

  if (!canManage && !canViewAssigned) {
    return (
      <AdminShell eyebrow="Home Collection" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to home collection requests.
        </p>
      </AdminShell>
    );
  }

  const [requests, phlebotomists] = await Promise.all([
    listHomeCollectionRequests(staff.role, staff.userId),
    canManage ? listActivePhlebotomists(staff.role) : Promise.resolve([]),
  ]);

  return (
    <AdminShell
      eyebrow="Home Collection · Staff Area"
      title={canManage ? "Home collection requests" : "My assigned visits"}
      lead={
        canManage
          ? `${requests.length} request${requests.length === 1 ? "" : "s"} · assign a phlebotomist and track status.`
          : "Home collection requests currently assigned to you."
      }
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      {requests.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          {canManage ? "No home collection requests yet." : "No visits assigned to you yet."}
        </p>
      ) : (
        <div className="surface-card divide-y divide-border">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <span className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-navy">
                  <Home className="h-4 w-4" />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy-deep">{r.full_name}</span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {r.phone} {"\u00b7"} {r.preferred_date ?? "\u2014"} {r.preferred_time ?? ""}
                  </span>
                  <span className="block text-xs text-muted-foreground">{r.address}</span>
                  {r.landmark ? <span className="block text-xs text-muted-foreground">Landmark: {r.landmark}</span> : null}
                  {r.latitude != null && r.longitude != null ? (
                    <a href={r.map_url || `https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-purple hover:text-navy"><MapPin className="h-3 w-3" /> View map location <ExternalLink className="h-3 w-3" /></a>
                  ) : <span className="block text-xs text-amber-700">No map pin supplied</span>}
                  {r.payment_status !== "paid" && r.payment_status !== "waived" ? <span className="mt-1 block text-xs font-semibold text-amber-700">Payment not verified — do not dispatch yet.</span> : null}
                  {r.notes ? <span className="block text-xs text-muted-foreground">{r.notes}</span> : null}
                  {r.booking_reference ? (
                    <span className="block font-mono text-[0.65rem] text-muted-foreground">{r.booking_reference}</span>
                  ) : null}
                </span>
              </span>
              <div className="flex flex-wrap items-start gap-3">
                {canManage ? (
                  <AssignPhlebotomistForm requestId={r.id} phlebotomists={phlebotomists} assignedId={r.assigned_phlebotomist_id} />
                ) : null}
                <HomeCollectionStatusForm requestId={r.id} status={r.status} />
                {canManage ? (
                  <HomeCollectionPaymentForm
                    requestId={r.id}
                    paymentStatus={r.payment_status}
                    paymentAmountNgn={r.payment_amount_ngn}
                    paymentNotes={r.payment_notes}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
