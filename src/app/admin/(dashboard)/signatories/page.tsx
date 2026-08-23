import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllSignatories } from "@/lib/data/signatories";
import { listStaffProfiles } from "@/lib/data/staff";
import { getSignedSignatureUrl } from "@/lib/data/storage";
import { SignatoriesClient } from "./SignatoriesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signatories | Salem Staff Area",
  robots: { index: false, follow: false },
};

export default async function SignatoriesPage() {
  const staff = await requireStaff();
  const navItems = getAdminNavItems(staff);

  if (!can(staff, "documents.manage")) {
    return (
      <AdminShell eyebrow="Administration" title="Not available for your role" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}>
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Only a Super Admin can manage report signatories.
        </p>
      </AdminShell>
    );
  }

  const [signatories, staffDirectory] = await Promise.all([listAllSignatories(staff.role), listStaffProfiles(staff.role)]);

  const withSignedUrls = await Promise.all(
    signatories.map(async (s) => ({
      ...s,
      signedImageUrl: s.signature_image_url ? await getSignedSignatureUrl(s.signature_image_url) : null,
    }))
  );

  return (
    <AdminShell
      eyebrow="Administration · Staff Area"
      title="Report Signatories"
      lead={`${signatories.length} signatory record${signatories.length === 1 ? "" : "s"} · link an authorized staff login to a stored signature used on approved report PDFs.`}
      backTo="/admin"
      staffName={staff.fullName}
      staffRole={staff.role}
      navItems={navItems}
    >
      <SignatoriesClient signatories={withSignedUrls} staffDirectory={staffDirectory} />
    </AdminShell>
  );
}
