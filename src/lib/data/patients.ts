import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

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

/**
 * Full patient directory for the admin Patients section (Advanced 1 §4).
 * Distinct from searchPatientsByName (used by the results-entry "find or
 * register a patient" flow, which is reachable only by staff who already
 * hold reports.view/patients.register): this is the standalone directory
 * page, so it gates on patients.view explicitly.
 */
export async function listPatients(
  actorRole: StaffRole,
  opts?: { query?: string; limit?: number }
): Promise<Patient[]> {
  if (!hasPermission(actorRole, "patients.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view patients.`);
  }

  const supabase = getServiceRoleClient();
  let query = supabase.from("patients").select("*").order("created_at", { ascending: false });

  if (opts?.query && opts.query.trim().length > 0) {
    const q = opts.query.trim();
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function countPatients(actorRole: StaffRole): Promise<number> {
  if (!hasPermission(actorRole, "patients.view")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot view patients.`);
  }

  const supabase = getServiceRoleClient();
  const { count, error } = await supabase.from("patients").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function updatePatient(
  patientId: string,
  input: Partial<Pick<PatientInsert, "full_name" | "sex" | "date_of_birth" | "phone" | "email">>,
  actorRole: StaffRole,
  actorId?: string
): Promise<Patient> {
  if (!hasPermission(actorRole, "patients.update")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot edit patient records.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("patients").update(input).eq("id", patientId).select().single();
  if (error) throw error;

  await logAudit({
    action: "PATIENT_UPDATED",
    entityType: "patients",
    entityId: patientId,
    actorId,
    actorRole,
    metadata: { updated: Object.keys(input) },
  });

  return data;
}

export async function createPatient(input: PatientInsert, actorRole: StaffRole, actorId?: string): Promise<Patient> {
  if (!hasPermission(actorRole, "patients.register")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot register patients.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("patients").insert(input).select().single();

  if (error) throw error;

  await logAudit({
    action: "PATIENT_REGISTERED",
    entityType: "patients",
    entityId: data.id,
    actorId,
    actorRole,
    metadata: { fullName: input.full_name },
  });

  return data;
}
