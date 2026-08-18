"use client";

import { MapPin, Phone, Mail, Clock3, Instagram, AlertCircle, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/salem/WhatsAppButton";
import { siteConfig } from "@/data/siteContent";

const cards = [
  { icon: MapPin, title: "Visit the laboratory", lines: [siteConfig.address.line1, siteConfig.address.line2] },
  { icon: Phone, title: "Call or WhatsApp", lines: [siteConfig.phone.primary, siteConfig.phone.whatsapp] },
  { icon: Mail, title: "Email us", lines: [siteConfig.email.general, siteConfig.email.results] },
  { icon: Clock3, title: "Opening hours", lines: [siteConfig.hours.weekdays, siteConfig.hours.weekend] },
  { icon: Instagram, title: "Follow us", lines: [siteConfig.social.instagramHandle] },
];

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

export function ContactPageClient() {
  return (
    <section className="bg-background py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(({ icon: Icon, title: t, lines }) => (
            <div key={t} className="surface-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-navy">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-navy-deep">{t}</h2>
              {lines.map((l) => (
                <p key={l} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="surface-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy-deep">Send us a message</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Our front desk aims to reply to every enquiry within one working day.
            </p>
            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              <label className="block text-sm font-medium text-navy-deep">
                Full name
                <input className={fieldClass} placeholder="Your name" name="name" />
              </label>
              <label className="block text-sm font-medium text-navy-deep">
                Phone number
                <input className={fieldClass} placeholder="+234 …" name="phone" />
              </label>
              <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
                Email address
                <input className={fieldClass} placeholder="you@email.com" name="email" />
              </label>
              <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
                How can we help?
                <textarea rows={5} className={fieldClass} placeholder="Tell us what you need…" name="message" />
              </label>
              <button
                type="submit"
                className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
              >
                <Send className="h-4 w-4 shrink-0" /> Send message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="surface-card overflow-hidden">
              <div className="grid-lab relative grid h-72 place-items-center bg-secondary">
                <div className="text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-primary-foreground">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-navy-deep">{siteConfig.address.line1}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Map to be added once the address is confirmed</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
              <span className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" /> Urgent or critical results
              </span>
              <p className="mt-3 text-sm leading-relaxed text-navy">
                If your physician flagged a result as urgent, call our records desk directly on{" "}
                <a href={siteConfig.phone.primaryHref} className="font-semibold underline">
                  {siteConfig.phone.primary}
                </a>
                .
              </p>
            </div>

            <a
              href={siteConfig.phone.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 shrink-0" /> Chat with us on WhatsApp
            </a>

            <a
              href={siteConfig.social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-navy shadow-soft transition-transform hover:scale-[1.02] hover:border-cyan"
            >
              <Instagram className="h-4.5 w-4.5 shrink-0" /> Follow us on Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
