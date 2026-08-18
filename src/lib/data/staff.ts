import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";

type StaffProfile = Database["public"]["Tables"]["staff_profiles"]["Row"];

/**
 * Creates a Supabase Auth user + matching staff_profiles row in one call.
 * Uses the Supabase Admin API (auth.admin.createUser), which requires the
 * service role key — there is no other way to provision an auth user
 * server-side. Passwords are handed to Supabase Auth directly and are never
 * stored by this application (Phase 3 §2 "Do not store passwords manually").
 *
 * Callers MUST authorize the caller first (staff.manage — super_admin only)
 * via lib/auth/session.ts `requirePermission("staff.manage")` before
 * calling this — enforced here too as a second check, since this bypasses
 * RLS by necessity (creating the first row for a brand-new user can't go
 * through a policy keyed on that same user's not-yet-existing profile).
 */
export async function createStaffAccount(input: {
  email: string;
  password: string;
  fullName: string;
  role: StaffRole;
  qualification?: string;
  designation?: string;
  phone?: string;
  actorRole: StaffRole;
}): Promise<StaffProfile> {
  if (!hasPermission(input.actorRole, "staff.manage")) {
    throw new Error(`Forbidden: role "${input.actorRole}" cannot manage staff accounts.`);
  }

  const supabase = getServiceRoleClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (createError) throw createError;
  if (!created.user) throw new Error("Failed to create staff auth user.");

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .insert({
      id: created.user.id,
      full_name: input.fullName,
      role: input.role,
      qualification: input.qualification,
      designation: input.designation,
      phone: input.phone,
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the orphaned auth user if the profile insert fails.
    await supabase.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }

  return profile;
}

export async function deactivateStaffAccount(staffId: string, actorRole: StaffRole): Promise<void> {
  if (!hasPermission(actorRole, "staff.manage")) {
    throw new Error(`Forbidden: role "${actorRole}" cannot manage staff accounts.`);
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("staff_profiles").update({ is_active: false }).eq("id", staffId);
  if (error) throw error;
}

export async function listStaffProfiles(actorRole: StaffRole): Promise<StaffProfile[]> {
  if (!hasPermission(actorRole, "staff.manage") && actorRole !== "admin") {
    // admin can view (but not manage) staff per the permission matrix —
    // "admin: ... NO staff management" refers to create/deactivate, not the
    // read-only directory used for e.g. assigning report signatories.
    throw new Error(`Forbidden: role "${actorRole}" cannot view the staff directory.`);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("staff_profiles").select("*").order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
