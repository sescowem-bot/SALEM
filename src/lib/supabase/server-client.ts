import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Session-aware Supabase client for Server Components, Route Handlers, and
 * Server Actions. Uses the ANON key plus the caller's own auth cookies, so
 * every query it makes goes through Row Level Security as that specific
 * signed-in staff member — this is the client ordinary staff operations
 * should use, NOT the service-role client in service-client.ts (which
 * intentionally bypasses RLS and is reserved for the small set of
 * system/internal operations documented in lib/data/labReports.ts).
 *
 * Must be created fresh per request (it closes over the current request's
 * cookies via next/headers).
 */
export async function getSessionClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)."
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (not a Server Action/Route
          // Handler) — cookies can't be written here. Session refresh for
          // that case is handled by middleware.ts on the next request.
        }
      },
    },
  });
}
