import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllServicesForAdmin } from "@/lib/data/testCatalog";
import { ServicesTable } from "./ServicesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function ServicesAdminPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "catalogue.manage")) {
    return (
      <AdminShell eyebrow="Services" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Your role ({staff.role}) does not have access to service management.
        </p>
      </AdminShell>
    );
  }

  const services = await listAllServicesForAdmin(staff.role);

  return (
    <AdminShell
      eyebrow="Services · Staff Area"
      title="Services"
      lead={`${services.length} service${services.length === 1 ? "" : "s"} in the catalogue. Controls what shows on the public /services directory — separate from whether a test is active for booking and result entry.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <div className="mb-5 flex justify-end">
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4 shrink-0" /> Add service
        </Link>
      </div>
      <ServicesTable services={services} />
    </AdminShell>
  );
}
