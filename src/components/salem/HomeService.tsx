import { Check, MapPin, ShieldCheck, Bike } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WhatsAppIcon } from "./WhatsAppButton";
import { siteConfig } from "@/data/siteContent";

const homeCollection = "/images/home-collection.jpg";

const points = [
  "Trained phlebotomists in branded, sterile kit",
  "Cold-chain sample transport to the lab",
  "Same-day pickup slots across the city",
  "Ideal for elderly, antenatal and busy patients",
];

export function HomeService() {
  return (
    <section id="home-service" className="bg-background py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="relative min-w-0 order-last lg:order-first">
          <div className="overflow-hidden rounded-[2rem] shadow-lift">
            <Image
              src={homeCollection}
              alt="Salem phlebotomist collecting a blood sample from a patient at home"
              loading="lazy"
              width={1408}
              height={1008}
              className="h-[20rem] w-full object-cover sm:h-[26rem] lg:h-[32rem]"
            />
          </div>
          <div className="absolute -bottom-6 right-4 flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-lift sm:right-8">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
              <Bike className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-deep">Scheduled home visits</p>
              <p className="text-xs text-muted-foreground">Time confirmed when you book</p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
            Home Sample Collection
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
            The laboratory comes to your living room.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Book a home visit by phone or WhatsApp and one of our phlebotomists arrives at your
            chosen time with everything needed for a safe, comfortable collection.
          </p>

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

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/home-collection"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
            >
              <MapPin className="h-4 w-4 shrink-0" /> Request a home visit
            </Link>
            <a
              href={siteConfig.phone.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-whatsapp/40 bg-whatsapp/10 px-6 py-3.5 text-sm font-semibold text-navy-deep transition-colors hover:bg-whatsapp/20"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 shrink-0" /> Chat to arrange
            </a>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" />
            Single-use consumables and full biohazard disposal on every visit.
          </p>
        </div>
      </div>
    </section>
  );
}
