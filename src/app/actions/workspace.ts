"use server";

import { redirect } from "next/navigation";

import { isUserRole } from "@/config/roles";
import { getSafePathForRole } from "@/lib/auth-redirect";
import { getWorkspaceHome } from "@/lib/auth/workspace-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function switchWorkspace(formData: FormData) {
  const value = formData.get("role");
  const requestedNextPath = formData.get("next");

  if (typeof value !== "string" || !isUserRole(value)) {
    throw new Error("Invalid workspace role.");
  }

  const nextPath =
    typeof requestedNextPath === "string"
      ? getSafePathForRole(requestedNextPath, value)
      : getWorkspaceHome(value);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?role=${value}&next=${encodeURIComponent(nextPath)}`);
  }

  const { error: roleInsertError } = await supabase
    .from("user_roles")
    .insert({ user_id: user.id, role: value });

  if (roleInsertError && roleInsertError.code !== "23505") {
    throw new Error("Unable to add the workspace role.");
  }

  const { error: activeRoleError } = await supabase
    .from("profiles")
    .update({ active_role: value })
    .eq("id", user.id);

  if (activeRoleError) {
    throw new Error("Unable to switch the active workspace.");
  }

  redirect(nextPath);
}
