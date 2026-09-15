import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions | Salem Medical Laboratories",
  description: "Terms governing use of the Salem Medical Laboratories website and online services.",
};

export default function TermsPage() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" lead="The basic terms for using Salem Medical Laboratories' website, booking and result-access services." />
      <section className="bg-background py-14 lg:py-20">
        <article className="legal-copy mx-auto max-w-4xl px-5 sm:px-6">
          <h2>Website use</h2>
          <p>This website provides general information about Salem Medical Laboratories and access to selected online services. Information on the website should not be treated as a substitute for professional medical advice.</p>
          <h2>Bookings</h2>
          <p>Submitting an appointment request does not by itself guarantee a confirmed appointment. Salem may contact you to confirm the date, time, test and location.</p>
          <h2>Home collection</h2>
          <p>Home visits require a usable address and may be subject to operational availability. Where manual payment is required, a home visit is not confirmed until payment has been received and verified by Salem.</p>
          <h2>Laboratory results</h2>
          <p>Result access is intended for the patient or an authorised recipient. Keep result access details private and contact Salem if you believe your result has been accessed by someone without permission.</p>
          <h2>Accuracy</h2>
          <p>We aim to keep website information accurate and current, but service availability, turnaround times, prices, opening hours and other operational details may change. The laboratory record and authorised staff communication take precedence where appropriate.</p>
          <h2>Prohibited use</h2>
          <p>You must not misuse the website, attempt to gain unauthorised access, interfere with its operation, submit fraudulent information or use another person's private information without authorisation.</p>
          <h2>Third-party services</h2>
          <p>The website may link to services such as Google Maps, WhatsApp or other external providers. Their own terms and privacy policies apply to those services.</p>
          <h2>Changes</h2>
          <p>These terms may be updated when the website or service process changes. The latest version published here applies to future use of the website.</p>
          <p className="text-sm text-muted-foreground">Last updated: 14 September 2026.</p>
        </article>
      </section>
    </SiteLayout>
  );
}
