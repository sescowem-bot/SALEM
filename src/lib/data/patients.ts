import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];

export async function searchPatientsByName(query: string): Promise<Patient[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .ilike("full_name", `%${query}%`)
    .order("full_name", { ascending: true })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

/**
 * Get a patient's report history — used so the Add New Result screen can
 * show prior reports for context without allowing them to be edited from
 * that screen (Phase 2A §C).
 */
export async function getPatientReportHistory(patientId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("lab_reports")
    .select("id, lab_number, status, date_reported, request, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPatient(input: PatientInsert): Promise<Patient> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("patients").insert(input).select().single();

  if (error) throw error;
  return data;
}
