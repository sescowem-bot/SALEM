import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/salem/SiteLayout";

export default function ServiceNotFound() {
  return (
    <SiteLayout>
      <section className="flex min-h-[60vh] items-center justify-center bg-background px-5 py-20">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-navy">
            <FlaskConical className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold text-navy-deep">We couldn&apos;t find that service</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This service may have been renamed, unpublished, or never existed. Browse our full test catalogue instead.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
          >
            View all services <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
