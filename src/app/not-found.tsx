import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Page Not Found | Salem Medical Laboratories",
  description: "The requested Salem Medical Laboratories page could not be found.",
  pathname: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="bg-background px-5 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple">404</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy-deep">Page not found</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">The page you requested is unavailable or may have moved.</p>
          <Link href="/" className="mt-8 inline-flex rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft">Return to Salem Medical Laboratories</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
