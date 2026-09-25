import type { Metadata } from "next";
import { publicMetadata, getSeoContent, getSiteSeoImage } from "@/lib/seo";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { listPublishedServices } from "@/lib/data/testCatalog";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { BookPageClient } from "./BookPageClient";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import type { BookingContent } from "@/lib/data/websiteContentTypes";
import { defaultBookingContent } from "@/components/salem/pages";

const description =
  "Book a laboratory test at Salem Medical Laboratories — choose your test, date, walk-in or home collection, and confirm.";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  return publicMetadata({ title: "Book a Test | Salem Medical Laboratories", description: "Book a laboratory test at Salem Medical Laboratories — choose your test, date, walk-in or home collection, and confirm.", pathname: "/book", image: await getSiteSeoImage(), noIndex: seo.robotsIndex === false });
}


export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ testId?: string }>;
}) {
  const { testId } = await searchParams;
  const bookingContent = { ...defaultBookingContent, ...(await getPublishedPageContent<BookingContent>("booking")) };
  // Advanced 8 §4 fix: this used to call listActiveTests(), which only
  // checks is_active and ignores content_status — so a brand-new
  // investigation still sitting in "draft" (not yet published) could be
  // booked from this public page before it was ever published on
  // /services. listPublishedServices() is the same published-only read
  // already used by the public Services pages, so booking and the public
  // catalogue now agree on what's actually visible to patients.
  const tests = await listPublishedServices();
  const preselectedTest = testId ? tests.find((t) => t.id === testId) : undefined;

  // Admin-controlled scheduling rules (Advanced 7 QA §2) — falls back to
  // sane defaults (14 days ahead, 2 hours notice) if settings can't be
  // loaded, so booking never breaks because of this.
  let bookingWindowDays = 14;
  let bookingMinNoticeHours = 2;
  try {
    const settings = await getSiteSettings();
    bookingWindowDays = settings.bookingWindowDays;
    bookingMinNoticeHours = settings.bookingMinNoticeHours;
  } catch {
    // keep defaults
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Book a Test"
        title={bookingContent.pageTitle!}
        lead={bookingContent.introduction!}
      />
      <p className="mx-auto max-w-7xl px-5 pt-4 text-center text-xs text-muted-foreground sm:px-6">{bookingContent.bookingNotice}</p>
      <BookPageClient
        tests={tests}
        preselectedTestName={preselectedTest?.name}
        preselectedTest={preselectedTest}
        bookingWindowDays={bookingWindowDays}
        bookingMinNoticeHours={bookingMinNoticeHours}
        confirmationTitle={bookingContent.confirmationTitle}
        confirmationMessage={bookingContent.confirmationMessage}
      />
    </SiteLayout>
  );
}
