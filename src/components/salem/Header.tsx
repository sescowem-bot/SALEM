"use client";

import { useEffect, useState } from "react";
import { Menu, X, Phone, CalendarCheck } from "lucide-react";
import { InstagramIcon } from "@/components/salem/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SalemLogo } from "./Logo";
import { siteConfig } from "@/data/siteContent";
import type { ResolvedSiteSettings } from "@/lib/data/siteSettings";

const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Packages", href: "/packages" },
  { label: "Home Collection", href: "/home-collection" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export function Header({ settings }: { settings?: ResolvedSiteSettings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const tagline = settings?.tagline ?? siteConfig.tagline;
  const hoursWeekdays = settings?.hoursWeekdays ?? siteConfig.hours.weekdays;
  const phonePrimary = settings?.phonePrimary ?? siteConfig.phone.primary;
  const phonePrimaryHref = settings?.phonePrimaryHref ?? siteConfig.phone.primaryHref;
  const instagramUrl = settings?.socialInstagram ?? siteConfig.social.instagramUrl;
  const logoUrl = settings?.logoUrl ?? null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className={`hidden w-full border-b border-white/10 bg-navy-deep text-[0.78rem] text-cyan-soft/80 transition-all lg:block ${
          scrolled ? "h-0 overflow-hidden opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <p>{tagline}</p>
          <div className="flex items-center gap-6">
            <span>{hoursWeekdays}</span>
            <a href={phonePrimaryHref} className="flex items-center gap-2 hover:text-white">
              <Phone className="h-3.5 w-3.5" /> {phonePrimary}
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Salem Medical Laboratories on Instagram"
              className="flex items-center gap-2 hover:text-white"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div
        className={`w-full transition-all duration-300 ${
          scrolled ? "bg-background/90 shadow-soft backdrop-blur-xl" : "bg-background/70 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 sm:px-6 lg:py-4">
          <Link href="/" className="min-w-0">
            <SalemLogo logoUrl={logoUrl} />
          </Link>

          <div className="flex items-center gap-2">
            <nav className="mr-2 hidden items-center gap-0.5 lg:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-navy-deep ${
                    isActive(item.href) ? "bg-accent text-navy-deep" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/results"
              className="hidden rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-cyan hover:bg-accent sm:inline-flex"
            >
              Access Results
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03] sm:px-5"
            >
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Book an Appointment</span>
              <span className="sm:hidden">Book</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
              className="ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-navy lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-background px-5 pb-5 pt-2 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent ${
                  isActive(item.href) ? "bg-accent text-navy" : "text-navy"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/results"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl border border-border px-3 py-3 text-sm font-semibold text-navy"
            >
              Access Your Results
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
