import type { Metadata } from "next";
import { publicMetadata, getSeoContent, getSiteSeoImage } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import { Check, ShieldCheck, Syringe, ClipboardList, MapPin, PhoneCall } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";
import { WhatsAppIcon } from "@/components/salem/WhatsAppButton";
import { siteConfig } from "@/data/siteContent";
import { HomeCollectionFormClient } from "./HomeCollectionFormClient";

const description =
  "Book a home visit and have a Salem phlebotomist collect your sample safely and comfortably at home.";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  return publicMetadata({ title: "Home Sample Collection | Salem Medical Laboratories", description: "Book a home visit and have a Salem phlebotomist collect your sample safely and comfortably at home.", pathname: "/home-collection", image: await getSiteSeoImage(), noIndex: seo.robotsIndex === false });
}


const steps = [
  {
    icon: ClipboardList,
    title: "Tell us what you need",
    body: "Book online, by phone or WhatsApp with your test and preferred time.",
  },
  {
    icon: MapPin,
    title: "We confirm your slot",
    body: "Our team confirms your address and appointment window.",
  },
  {
    icon: Syringe,
    title: "Safe, sterile collection",
    body: "A trained phlebotomist collects your sample using single-use equipment.",
  },
  {
    icon: ShieldCheck,
    title: "Cold-chain to the lab",
    body: "Your sample is transported securely for processing.",
  },
];

const points = [
  "Trained phlebotomists using sterile, single-use kit",
  "Careful sample handling from your home to our laboratory",
  "Ideal for elderly, antenatal and busy patients",
  "Full biohazard disposal on every visit",
];

export default function HomeCollectionPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Home Sample Collection"
        title="The laboratory comes to your living room."
        lead="Book a home visit and one of our phlebotomists arrives at your chosen time with everything needed for a safe, comfortable collection."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="#request-form"
            className="inline-flex items-center gap-2 rounded-full gradient-accent px-6 py-3.5 text-sm font-semibold text-navy-deep shadow-glow transition-transform hover:scale-[1.03]"
          >
            <MapPin className="h-4 w-4 shrink-0" /> Request a home visit
          </Link>
          <a
            href={siteConfig.phone.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
          >
            <WhatsAppIcon className="h-4.5 w-4.5 shrink-0" /> Chat to arrange
          </a>
        </div>
      </PageHeader>

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-[2rem] shadow-lift">
              <Image
                src="/images/home-collection.jpg"
                alt="Salem phlebotomist collecting a blood sample from a patient at home"
                loading="lazy"
                width={1408}
                height={1008}
                className="h-[20rem] w-full object-cover sm:h-[26rem] lg:h-[32rem]"
              />
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
              What to expect
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
              Comfortable, private, and handled with care.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-navy">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-relaxed text-navy">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
              Four steps from booking to sample pickup.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title: t, body }, i) => (
              <div key={t} className="surface-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl gradient-accent text-navy-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-semibold text-purple">Step 0{i + 1}</p>
                <h3 className="mt-1 text-base font-semibold text-navy-deep">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="surface-card flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-xl font-semibold text-navy-deep">
                Ready to book your home visit?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us your test and preferred time — we&apos;ll confirm the rest.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#request-form"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
              >
                <PhoneCall className="h-4 w-4 shrink-0" /> Book a home visit
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="request-form" className="bg-secondary py-16 lg:py-24 scroll-mt-24">
        <div className="mx-auto max-w-2xl px-5 sm:px-6">
          <HomeCollectionFormClient />
        </div>
      </section>
    </SiteLayout>
  );
}
