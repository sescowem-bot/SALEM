import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY client using the service role key. This bypasses Row Level
 * Security entirely — it must never be imported into a Client Component or
 * any code path that ships to the browser.
 *
 * The `server-only` import above will fail the build if this module is ever
 * pulled into a client bundle. As a second line of defence (in case
 * `server-only` isn't installed yet — see package.json / README), the
 * runtime check below throws immediately if this ever executes in a
 * browser context.
 *
 * There is no Supabase Auth in this phase, so every read/write to the
 * lab-result tables happens through this client from trusted server code
 * only (Server Components, Route Handlers, Server Actions) — never from a
 * client-side fetch. When Phase 3 (Auth) lands, staff-facing reads/writes
 * should move to a session-scoped client under RLS policies instead of this
 * one wherever possible.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/supabase/service-client.ts was imported in a browser context. " +
      "This module holds the Supabase service role key and must only run on the server."
  );
}

let cachedClient: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
