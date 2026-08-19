import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { BookPageClient } from "./BookPageClient";

const description =
  "Book a laboratory test at Salem Medical Laboratories — choose your test, date, walk-in or home collection, and confirm.";

export const metadata: Metadata = {
  title: "Book a Test | Salem Medical Laboratories",
  description,
  openGraph: { title: "Book a Test | Salem Medical Laboratories", description, type: "website" },
  twitter: { card: "summary_large_image", title: "Book a Test | Salem Medical Laboratories", description },
};

export default function BookPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Book a Test"
        title="Booking a test should take two minutes, not two calls."
        lead="Pick your test, choose a time, and tell us where to meet you. Our front desk confirms every booking personally."
      />
      <BookPageClient />
    </SiteLayout>
  );
}
