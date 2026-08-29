import { Loader2 } from "lucide-react";

/**
 * Advanced 8 §7 fix: no route in the app had a loading.tsx, so navigating
 * to any public page that fetches from Supabase (services, book, etc.)
 * showed a frozen/blank screen until the fetch resolved instead of an
 * immediate response to the click. This Suspense-boundary fallback covers
 * every public route (App Router renders it automatically while the
 * segment's Server Component data is loading).
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-navy" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
