import type { Metadata } from "next";
import { Home } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listHomeCollectionRequests, listActivePhlebotomists } from "@/lib/data/homeCollection";
import { HomeCollectionStatusForm, AssignPhlebotomistForm } from "./HomeCollectionForms";

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
          ? "All public home-sample-collection requests. Assign a phlebotomist and track status."
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
                  <span className="block text-sm font-semibold text-navy-deep">{r.full_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {r.phone} {"\u00b7"} {r.preferred_date ?? "\u2014"} {r.preferred_time ?? ""}
                  </span>
                  <span className="block text-xs text-muted-foreground">{r.address}</span>
                  {r.notes ? <span className="block text-xs text-muted-foreground">{r.notes}</span> : null}
                  {r.booking_reference ? (
                    <span className="block font-mono text-[0.65rem] text-muted-foreground">{r.booking_reference}</span>
                  ) : null}
                </span>
              </span>
              <div className="flex flex-wrap items-start gap-3">
                {canManage ? <AssignPhlebotomistForm requestId={r.id} phlebotomists={phlebotomists} /> : null}
                <HomeCollectionStatusForm requestId={r.id} status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
