"use server";

import { redirect } from "next/navigation";
import { getSessionClient } from "@/lib/supabase/server-client";

export interface SignInState {
  error?: string;
}

/**
 * Signs a staff member in via Supabase Auth using the session (cookie-based)
 * client, so the session is stored in httpOnly cookies — never
 * localStorage (Phase 3 §7). No patient accounts are created anywhere in
 * this flow; this only authenticates against auth.users.
 */
export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await getSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect(redirectTo.startsWith("/admin") && !redirectTo.startsWith("/admin/login") ? redirectTo : "/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
