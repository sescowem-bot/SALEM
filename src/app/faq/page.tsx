import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WhatsAppIcon } from "@/components/salem/WhatsAppButton";
import { siteConfig } from "@/data/siteContent";

const description =
  "Answers to common questions about booking a test, home sample collection, preparing for tests, and accessing your Salem laboratory results.";

export const metadata: Metadata = {
  title: "FAQs | Salem Medical Laboratories",
  description,
  openGraph: { title: "FAQs | Salem Medical Laboratories", description, type: "website" },
  twitter: { card: "summary_large_image", title: "FAQs | Salem Medical Laboratories", description },
};

const groups = [
  {
    heading: "Booking & appointments",
    items: [
      {
        q: "How do I book a test?",
        a: "Use the Book an Appointment page to choose a date, time and location, or call/WhatsApp our front desk and we'll confirm your booking personally.",
      },
      {
        q: "Can I book for a walk-in visit instead of scheduling ahead?",
        a: "Yes. Walk-ins are welcome during opening hours, though booking ahead helps us prepare for your specific test.",
      },
      {
        q: "Do I need a doctor's request form?",
        a: "Some tests require a referring doctor's request; others can be booked directly. If you're unsure, share the test name with our front desk and they'll confirm.",
      },
    ],
  },
  {
    heading: "Preparing for your test",
    items: [
      {
        q: "Do I need to fast before my test?",
        a: "Some tests, such as fasting blood sugar or a lipid profile, require 8–12 hours of fasting. Your booking confirmation will tell you if fasting applies to your test.",
      },
      {
        q: "What should I bring on the day?",
        a: "Bring a valid ID, your doctor's request form if you have one, and your booking reference. If it's a repeat test, previous results are helpful but not required.",
      },
    ],
  },
  {
    heading: "Home sample collection",
    items: [
      {
        q: "How does home sample collection work?",
        a: "Book a home visit through our Home Collection page or by WhatsApp. A trained phlebotomist arrives at your chosen time with sterile, single-use equipment to collect your sample.",
      },
      {
        q: "Is home collection available everywhere?",
        a: "Coverage depends on your location. Let us know your address when booking and we'll confirm whether home collection is available for you.",
      },
    ],
  },
  {
    heading: "Accessing your results",
    items: [
      {
        q: "How will I know when my result is ready?",
        a: "We notify you by SMS, email or WhatsApp once your report has been reviewed and released, along with your lab reference number and a one-time access code.",
      },
      {
        q: "How do I view my result online?",
        a: "Visit the Access Your Results page and enter your lab reference number and one-time access code to securely view or download your report.",
      },
      {
        q: "Can I get help understanding my result?",
        a: "Yes. Contact our records desk and a member of our team will arrange a call to walk you through your report. We recommend discussing results with your physician for clinical decisions.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Frequently Asked Questions"
        title="Answers before you even have to ask."
        lead="Can't find what you're looking for? Reach out and our team will help directly."
      />

      <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          {groups.map((g) => (
            <div key={g.heading} className="mb-10 last:mb-0">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-purple">
                {g.heading}
              </h2>
              <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border bg-card px-2 shadow-soft">
                {g.items.map((item, i) => (
                  <AccordionItem key={item.q} value={`${g.heading}-${i}`} className="border-border px-4">
                    <AccordionTrigger className="text-sm font-semibold text-navy-deep hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-navy-deep">Still have a question?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Our team replies quickly on WhatsApp or by phone.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={siteConfig.phone.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" /> WhatsApp us
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent"
              >
                Contact page
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
