import { CalendarCheck, Phone, Mail, MapPin, Clock3 } from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "./WhatsAppButton";
import { siteConfig } from "@/data/siteContent";

export function BookingCta() {
  return (
    <section id="book" className="bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-border bg-secondary p-8 shadow-soft sm:p-12 lg:p-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-periwinkle/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="min-w-0">
              <h2 className="text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
                Book your appointment in under two minutes.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Choose a walk-in slot at our laboratory or a home collection visit. Our front desk
                confirms every booking personally.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
                >
                  <CalendarCheck className="h-4 w-4 shrink-0" /> Book Appointment
                </Link>
                <a
                  href={siteConfig.phone.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 shrink-0" /> Book on WhatsApp
                </a>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple">
                What we&apos;ll need
              </p>
              <ul className="mt-4 space-y-3 text-sm text-navy">
                {[
                  "Your name and phone number",
                  "Test or panel requested (or your doctor's request form)",
                  "Preferred date, time and location",
                ].map((t, i) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[0.7rem] font-bold text-navy">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                Payment is completed at the laboratory or on collection. Online payment is coming
                soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const contactCards = [
  {
    icon: MapPin,
    title: "Visit the laboratory",
    lines: [siteConfig.address.line1, siteConfig.address.line2],
  },
  {
    icon: Phone,
    title: "Call or WhatsApp",
    lines: [siteConfig.phone.primary, siteConfig.phone.whatsapp],
  },
  { icon: Mail, title: "Email us", lines: [siteConfig.email.general, siteConfig.email.results] },
  {
    icon: Clock3,
    title: "Opening hours",
    lines: [siteConfig.hours.weekdays, siteConfig.hours.weekend],
  },
];

export function Contact() {
  return (
    <section id="contact" className="bg-secondary py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
            Contact &amp; Location
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
            We&apos;re close by, and easy to reach.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map(({ icon: Icon, title, lines }) => (
            <div key={title} className="surface-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-navy-deep">{title}</h3>
              {lines.map((l) => (
                <p key={l} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
