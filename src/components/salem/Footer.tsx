import { Phone, Mail, MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/salem/icons";
import Link from "next/link";
import { SalemLogo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppButton";
import { siteConfig } from "@/data/siteContent";
import type { ResolvedSiteSettings } from "@/lib/data/siteSettings";
import type { FooterContent } from "@/lib/data/websiteContentTypes";

const columns = [
  {
    title: "Services",
    links: [
      { label: "Haematology", href: "/services" },
      { label: "Microbiology", href: "/services" },
      { label: "Molecular & Serology", href: "/services" },
      { label: "Health packages", href: "/packages" },
    ],
  },
  {
    title: "Patients",
    links: [
      { label: "Book appointment", href: "/book" },
      { label: "Home collection", href: "/home-collection" },
      { label: "Access results", href: "/results" },
      { label: "FAQs", href: "/faq" },
    ],
  },
];

export function Footer({ settings, content }: { settings?: ResolvedSiteSettings; content?: FooterContent }) {
  const tagline = content?.description || settings?.tagline || siteConfig.tagline;
  const addressLine1 = settings?.addressLine1 ?? siteConfig.address.line1;
  const addressLine2 = settings?.addressLine2 ?? siteConfig.address.line2;
  const phonePrimary = settings?.phonePrimary ?? siteConfig.phone.primary;
  const phonePrimaryHref = settings?.phonePrimaryHref ?? siteConfig.phone.primaryHref;
  const emailPrimary = settings?.emailPrimary ?? siteConfig.email.general;
  const whatsappHref = settings?.whatsappHref ?? siteConfig.phone.whatsappHref;
  const instagramUrl = settings?.socialInstagram ?? siteConfig.social.instagramUrl;
  const copyrightText = content?.copyrightText || `${settings?.orgName ?? siteConfig.name}. All rights reserved.`;
  const logoUrl = settings?.logoLightUrl ?? settings?.logoUrl ?? null;

  return (
    <footer className="bg-navy-deep pb-10 pt-16 text-cyan-soft/70">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="min-w-0">
            <SalemLogo inverted logoUrl={logoUrl} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">{tagline}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="min-w-0">
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm transition-colors hover:text-cyan">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">Reach us</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                {addressLine1}, {addressLine2}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-cyan" />
                <a href={phonePrimaryHref} className="hover:text-cyan">
                  {phonePrimary}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-cyan" />
                <a href={`mailto:${emailPrimary}`} className="hover:text-cyan">
                  {emailPrimary}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-whatsapp" />
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan"
                >
                  Chat on WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <InstagramIcon className="h-4 w-4 shrink-0 text-cyan" />
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan"
                >
                  {siteConfig.social.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {copyrightText}</p>
          <p>Medical diagnostic laboratory</p>
        </div>
      </div>
    </footer>
  );
}
