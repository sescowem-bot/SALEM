import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";

export const metadata: Metadata = {
  title: "Legal Information | Salem Medical Laboratories",
  description: "Legal information and policies for Salem Medical Laboratories.",
};

export default function LegalPage() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Legal" title="Legal Information" lead="Policies and important information for using Salem Medical Laboratories online services." />
      <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto grid max-w-4xl gap-5 px-5 sm:px-6 md:grid-cols-2">
          <Link href="/privacy-policy" className="surface-card p-7">
            <h2 className="text-lg font-semibold text-navy-deep">Privacy Policy</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">How personal, booking and laboratory-related information is handled.</p>
            <span className="mt-5 inline-flex text-sm font-semibold text-purple">Read privacy policy →</span>
          </Link>
          <Link href="/terms-and-conditions" className="surface-card p-7">
            <h2 className="text-lg font-semibold text-navy-deep">Terms & Conditions</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Rules governing use of the website, bookings, home collection and result access.</p>
            <span className="mt-5 inline-flex text-sm font-semibold text-purple">Read terms →</span>
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
