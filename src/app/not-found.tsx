import Link from "next/link";
import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";

export const metadata: Metadata = {
  title: "Page Not Found | Salem Medical Laboratories",
  description: "The page you requested could not be found.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <SiteLayout><section className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple">404</p><h1 className="mt-3 text-4xl font-semibold text-navy-deep">Page not found</h1><p className="mt-4 text-muted-foreground">The page may have moved or no longer exists.</p><Link href="/" className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground">Back to home</Link></section></SiteLayout>;
}
