import { createBrowserClient } from "@supabase/ssr";

/**
 * Anon-key client. Safe to use in Client Components — it only ever has the
 * access RLS policies grant to the `anon` role (see
 * supabase/migrations/20260815100007_row_level_security.sql).
 *
 * As of Phase 2B, no lab-result tables have any anon policy at all (deny by
 * default), so this client currently has no read access to patient/report
 * data — that's intentional. It's established now as the pattern for future
 * public-safe reads (e.g. a future public "tests we offer" page) and for the
 * public intake forms (appointment/home-collection/contact), which allow
 * anon INSERT only.
 */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)."
    );
  }

  return createBrowserClient(url, anonKey);
}
