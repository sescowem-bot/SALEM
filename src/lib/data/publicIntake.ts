import { getBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Foundation for the future appointment / home-collection / contact forms.
 * Uses the anon client deliberately (not the service role) — these tables
 * only grant anon INSERT via RLS (see
 * supabase/migrations/20260815100007_row_level_security.sql), so this is
 * safe to eventually call from a Client Component.
 *
 * NOT wired into ContactPageClient.tsx / BookPageClient.tsx / the home
 * collection page yet — this phase only builds the backend foundation, per
 * "Do not redesign the public website."
 */

type AppointmentRequestInsert = Database["public"]["Tables"]["appointment_requests"]["Insert"];
type HomeCollectionRequestInsert = Database["public"]["Tables"]["home_collection_requests"]["Insert"];
type ContactSubmissionInsert = Database["public"]["Tables"]["contact_submissions"]["Insert"];

export async function submitAppointmentRequest(input: AppointmentRequestInsert) {
  const supabase = getBrowserClient();
  const { error } = await supabase.from("appointment_requests").insert(input);
  if (error) throw error;
}

export async function submitHomeCollectionRequest(input: HomeCollectionRequestInsert) {
  const supabase = getBrowserClient();
  const { error } = await supabase.from("home_collection_requests").insert(input);
  if (error) throw error;
}

export async function submitContactMessage(input: ContactSubmissionInsert) {
  const supabase = getBrowserClient();
  const { error } = await supabase.from("contact_submissions").insert(input);
  if (error) throw error;
}
