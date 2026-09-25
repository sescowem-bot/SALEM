import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { ResultsPageClient } from "./ResultsPageClient";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import type { ResultsContent } from "@/lib/data/websiteContentTypes";
import { defaultResultsContent } from "@/components/salem/pages";

const description =
  "Securely access your Salem laboratory report using your lab reference number and one-time access code.";

export const metadata: Metadata = publicMetadata({ title: "Access Your Results | Salem Medical Laboratories", description: "Securely access your Salem laboratory report using your lab reference number and one-time access code.", pathname: "/results", noIndex: true });

export default async function ResultsPage() {
  const content = { ...defaultResultsContent, ...(await getPublishedPageContent<ResultsContent>("results")) };
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Secure Result Access"
        title={content.pageTitle!}
        lead={content.introduction!}
      />
      <ResultsPageClient accessInstructions={content.accessInstructions} helpMessage={content.helpMessage} />
    </SiteLayout>
  );
}
