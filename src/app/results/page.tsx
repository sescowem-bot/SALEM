import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ResultsPageClient } from "./ResultsPageClient";

const description =
  "Securely access your Salem laboratory report using your lab reference number and one-time access code.";

export const metadata: Metadata = {
  title: "Access Your Results | Salem Medical Laboratories",
  description,
  openGraph: { title: "Access Your Results | Salem Medical Laboratories", description, type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "Access Your Results | Salem Medical Laboratories",
    description,
  },
};

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
