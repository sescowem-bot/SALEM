import Link from "next/link";
import {
  Droplet,
  Microscope,
  Dna,
  HeartPulse,
  FlaskConical,
  Baby,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";

const svcBlood = "/images/svc-blood.jpg";
const svcMicro = "/images/svc-micro.jpg";
const svcMolecular = "/images/svc-molecular.jpg";

const fallbackFeatured = [
  {
    image: svcBlood,
    icon: Droplet,
    title: "Haematology & Blood Chemistry",
    body: "Full blood count, lipid profile, liver and kidney panels, HbA1c and more — run on calibrated automated analysers.",
    href: "/services",
  },
  {
    image: svcMicro,
    icon: Microscope,
    title: "Microbiology & Parasitology",
    body: "Culture and sensitivity, stool and urine microscopy, malaria and typhoid screening interpreted by our scientists.",
    href: "/services",
  },
  {
    image: svcMolecular,
    icon: Dna,
    title: "Molecular & Serology",
    body: "PCR diagnostics, hormonal assays, hepatitis and retroviral screening with strict chain-of-custody handling.",
    href: "/services",
  },
];

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
  const hasCmsFeatured = featuredServices && featuredServices.length > 0;

  return (
    <section id="services" className="relative bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">
            Laboratory Services
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
            {heading || "A full diagnostic menu, under one careful roof."}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {description ||
              "Every sample is barcoded on arrival, processed under strict quality control and reviewed before release — so the result you receive is one you can act on."}
          </p>
        </div>

        {hasCmsFeatured ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices!.slice(0, 3).map((s) => (
              <article key={s.id} className="surface-card group overflow-hidden">
                <div className="relative h-52 overflow-hidden bg-secondary">
                  {s.heroImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- storage-hosted marketing image
                    <img src={s.heroImageUrl} alt={s.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <FlaskConical className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/75 to-transparent" aria-hidden="true" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-navy-deep">{s.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.publicDescription ?? "Speak with our team for details on this test."}
                  </p>
                  <Link
                    href={`/services/${s.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-purple transition-colors hover:text-navy"
                  >
                    View details <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fallbackFeatured.map(({ image, icon: Icon, title, body, href }) => (
              <article key={title} className="surface-card group overflow-hidden">
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={image}
                    alt={title}
                    loading="lazy"
                    width={900}
                    height={700}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/75 to-transparent" aria-hidden="true" />
                  <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-card/90 text-navy backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-navy-deep">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  <Link href={href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-purple transition-colors hover:text-navy">
                    View tests <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

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
