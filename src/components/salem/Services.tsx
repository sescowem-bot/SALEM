import Link from "next/link";
import {
  ArrowUpRight,
  Baby,
  Clock,
  Dna,
  FlaskConical,
  HeartPulse,
  Microscope,
  Star,
  Droplet,
  ScanLine,
  Activity,
} from "lucide-react";

const more = [
  {
    icon: HeartPulse,
    title: "Wellness & Executive Checks",
    body: "Curated packages for individuals, families and corporate teams.",
  },
  {
    icon: Baby,
    title: "Antenatal & Fertility Panels",
    body: "Gentle, private testing for mothers and couples at every stage.",
  },
  {
    icon: FlaskConical,
    title: "Histopathology & Cytology",
    body: "Tissue and smear analysis reviewed by consultant pathologists.",
  },
];

export interface HomepageFeaturedService {
  id: string;
  name: string;
  slug: string;
  publicDescription: string | null;
  heroImageUrl: string | null;
  categoryName: string | null;
  turnaroundTime: string | null;
  priceNgn: number | null;
  showPrice: boolean;
  featured: boolean;
}

function CategoryIcon({ category }: { category: string }) {
  const value = category.toLowerCase();
  if (value.includes("haemat") || value.includes("blood")) return Droplet;
  if (value.includes("micro")) return Microscope;
  if (value.includes("horm") || value.includes("endocr")) return Activity;
  if (value.includes("fertility") || value.includes("obstetric")) return Baby;
  if (value.includes("ultrasound") || value.includes("scan")) return ScanLine;
  if (value.includes("ecg") || value.includes("cardiac")) return HeartPulse;
  if (value.includes("serology") || value.includes("immun")) return Dna;
  return FlaskConical;
}

function PremiumNoImage({ service }: { service: HomepageFeaturedService }) {
  const Icon = CategoryIcon({ category: service.categoryName ?? "Laboratory" });
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-purple/80">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-white/10" />
      <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full border border-cyan/20" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex h-full flex-col justify-between p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
            <Icon className="h-6 w-6 text-cyan-soft" />
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-soft">Salem Diagnostics</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-soft/80">{service.categoryName ?? "Laboratory service"}</p>
          <p className="mt-2 max-w-[15rem] text-xl font-semibold leading-tight">Professional diagnostic service</p>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: HomepageFeaturedService }) {
  return (
    <article className="surface-card group flex flex-col overflow-hidden p-0">
      <div className="aspect-[16/9] w-full bg-secondary">
        {service.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage-hosted marketing image
          <img src={service.heroImageUrl} alt={service.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <PremiumNoImage service={service} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-navy">
            {service.categoryName ?? "Laboratory test"}
          </span>
          {service.featured ? (
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-amber-600">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          ) : null}
        </span>
        <Link href={`/services/${service.slug}`} className="mt-4 text-lg font-semibold text-navy-deep hover:text-navy">
          {service.name}
        </Link>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {service.publicDescription ?? "Speak with our team for details on this test."}
        </p>
        {service.turnaroundTime ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" /> {service.turnaroundTime}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          {service.showPrice && service.priceNgn != null ? (
            <span className="text-sm font-semibold text-navy-deep">₦{service.priceNgn.toLocaleString()}</span>
          ) : (
            <span />
          )}
          <Link href={`/services/${service.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple transition-colors hover:text-navy">
            View details <ArrowUpRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Services({
  heading,
  description,
  featuredServices,
}: {
  heading?: string;
  description?: string;
  featuredServices?: HomepageFeaturedService[];
}) {
  const services = (featuredServices ?? []).slice(0, 3);

  return (
    <section id="services" className="relative bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">Laboratory Services</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
            {heading || "A full diagnostic menu, under one careful roof."}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {description || "Every sample is barcoded on arrival, processed under strict quality control and reviewed before release — so the result you receive is one you can act on."}
          </p>
        </div>

        {services.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        ) : (
          <div className="mt-12 surface-card p-8 text-center">
            <FlaskConical className="mx-auto h-9 w-9 text-purple" />
            <h3 className="mt-4 text-lg font-semibold text-navy-deep">Our services are being updated</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Please explore the full catalogue or contact our team for current test availability.
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-deep">Looking for a specific investigation?</p>
            <p className="mt-1 text-sm text-muted-foreground">Explore the full published catalogue by category or search by test name.</p>
          </div>
          <Link href="/services" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]">
            Explore all services <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {more.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card flex items-start gap-4 p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-navy">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-navy-deep">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
