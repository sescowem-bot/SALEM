import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ResultsPageClient } from "./ResultsPageClient";

const description =
  "Securely access your Salem laboratory report using your lab reference number and one-time access code.";

export const metadata: Metadata = publicMetadata({ title: "Check Laboratory Results | Salem Medical Laboratories", description: "Securely access your Salem Medical Laboratories result using your report reference and access code.", pathname: "/results", noIndex: true });

export default function ResultsPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Secure Result Access"
        title="Your results. Yours alone."
        lead="No public patient portal, no shared inbox. Enter your lab reference number and the one-time access code sent to you to view your report."
      />
      <ResultsPageClient />
    </SiteLayout>
  );
}
