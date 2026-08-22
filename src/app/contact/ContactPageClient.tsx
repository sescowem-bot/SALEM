"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MapPin, Phone, Mail, Clock3, AlertCircle, Send, Check } from "lucide-react";
import { InstagramIcon } from "@/components/salem/icons";
import { WhatsAppIcon } from "@/components/salem/WhatsAppButton";
import { siteConfig } from "@/data/siteContent";
import { submitContactAction, type ContactState } from "./actions";
import type { ResolvedSiteSettings } from "@/lib/data/siteSettings";
import type { ContactContent } from "@/lib/data/websiteContentTypes";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const initialState: ContactState = {};

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
    >
      <Send className="h-4 w-4 shrink-0" /> {pending ? "Sending\u2026" : "Send message"}
    </button>
  );
}

export function ContactPageClient({ content, settings }: { content?: ContactContent; settings?: ResolvedSiteSettings }) {
  const [state, formAction] = useActionState(submitContactAction, initialState);

  const addressLine1 = settings?.addressLine1 ?? siteConfig.address.line1;
  const addressLine2 = settings?.addressLine2 ?? siteConfig.address.line2;
  const phonePrimary = settings?.phonePrimary ?? siteConfig.phone.primary;
  const phonePrimaryHref = settings?.phonePrimaryHref ?? siteConfig.phone.primaryHref;
  const whatsappNumber = settings?.whatsappNumber ?? siteConfig.phone.whatsapp;
  const whatsappHref = settings?.whatsappHref ?? siteConfig.phone.whatsappHref;
  const emailPrimary = settings?.emailPrimary ?? siteConfig.email.general;
  const hoursWeekdays = settings?.hoursWeekdays ?? siteConfig.hours.weekdays;
  const hoursWeekend = settings?.hoursWeekend ?? siteConfig.hours.weekend;
  const instagramUrl = settings?.socialInstagram ?? siteConfig.social.instagramUrl;
  const ctaLabel = content?.ctaLabel || "Chat with us on WhatsApp";
  const mapEmbedUrl = content?.mapEmbedUrl;

  const cards = [
    { icon: MapPin, title: "Visit the laboratory", lines: [addressLine1, addressLine2] },
    { icon: Phone, title: "Call or WhatsApp", lines: [phonePrimary, whatsappNumber] },
    { icon: Mail, title: "Email us", lines: [emailPrimary, siteConfig.email.results] },
    { icon: Clock3, title: "Opening hours", lines: [hoursWeekdays, hoursWeekend] },
    { icon: InstagramIcon, title: "Follow us", lines: [siteConfig.social.instagramHandle] },
  ];

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
            {state.ok ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-cyan/40 bg-accent p-5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
                <p className="text-sm text-navy-deep">
                  {"Message sent \u2014 our front desk will get back to you within one working day."}
                </p>
              </div>
            ) : (
            <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
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
              {state.error ? (
                <p className="sm:col-span-2 text-sm font-medium text-destructive">{state.error}</p>
              ) : null}
              <SendButton />
            </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="surface-card overflow-hidden">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map to Salem Medical Laboratories"
                />
              ) : (
                <div className="grid-lab relative grid h-72 place-items-center bg-secondary">
                  <div className="text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-primary-foreground">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-navy-deep">{addressLine1}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Map to be added once the address is confirmed</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
              <span className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" /> Urgent or critical results
              </span>
              <p className="mt-3 text-sm leading-relaxed text-navy">
                If your physician flagged a result as urgent, call our records desk directly on{" "}
                <a href={phonePrimaryHref} className="font-semibold underline">
                  {phonePrimary}
                </a>
                .
              </p>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 shrink-0" /> {ctaLabel}
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-navy shadow-soft transition-transform hover:scale-[1.02] hover:border-cyan"
            >
              <InstagramIcon className="h-4.5 w-4.5 shrink-0" /> Follow us on Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
