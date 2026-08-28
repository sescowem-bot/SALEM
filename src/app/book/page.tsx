import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { listActiveTests } from "@/lib/data/testCatalog";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { BookPageClient } from "./BookPageClient";

const description =
  "Book a laboratory test at Salem Medical Laboratories — choose your test, date, walk-in or home collection, and confirm.";

export const metadata: Metadata = {
  title: "Book a Test | Salem Medical Laboratories",
  description,
  openGraph: { title: "Book a Test | Salem Medical Laboratories", description, type: "website" },
  twitter: { card: "summary_large_image", title: "Book a Test | Salem Medical Laboratories", description },
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ testId?: string }>;
}) {
  const { testId } = await searchParams;
  const tests = await listActiveTests();
  const preselectedTest = testId ? tests.find((t) => t.id === testId) : undefined;

  // Admin-controlled scheduling rules (Advanced 7 QA §2) — falls back to
  // sane defaults (14 days ahead, 2 hours notice) if settings can't be
  // loaded, so booking never breaks because of this.
  let bookingWindowDays = 14;
  try {
    const settings = await getSiteSettings();
    bookingWindowDays = settings.bookingWindowDays;
  } catch {
    // keep default
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Book a Test"
        title="Booking a test should take two minutes, not two calls."
        lead="Pick your test, choose a time, and tell us where to meet you. Our front desk confirms every booking personally."
      />
      <BookPageClient
        tests={tests}
        preselectedTestName={preselectedTest?.name}
        preselectedTest={preselectedTest}
        bookingWindowDays={bookingWindowDays}
      />
    </SiteLayout>
  );
}
