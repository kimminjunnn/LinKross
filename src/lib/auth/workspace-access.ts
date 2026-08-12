import { cache } from "react";
import { redirect } from "next/navigation";

import { isUserRole, type UserRole } from "@/config/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext = {
  configured: boolean;
  userId: string | null;
  activeRole: UserRole | null;
  roles: UserRole[];
};

export function getWorkspaceHome(role: UserRole) {
  return role === "company" ? "/company" : "/freelancer";
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!configured) {
    return { configured: false, userId: null, activeRole: null, roles: [] };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { configured: true, userId: null, activeRole: null, roles: [] };
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("active_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (roleRows ?? [])
    .map(({ role }) => role)
    .filter((role): role is UserRole => isUserRole(role));
  const storedActiveRole = profile?.active_role;
  const activeRole =
    storedActiveRole && isUserRole(storedActiveRole) && roles.includes(storedActiveRole)
      ? storedActiveRole
      : (roles[0] ?? null);

  return {
    configured: true,
    userId: user.id,
    activeRole,
    roles,
  };
});

export async function requireWorkspaceRole(expectedRole: UserRole) {
  const context = await getAuthContext();

  // Keep local UI development available until Supabase is configured.
  if (!context.configured) {
    return context;
  }

  if (!context.userId) {
    redirect(`/login?role=${expectedRole}`);
  }

  if (context.roles.length === 0) {
    redirect("/onboarding");
  }

  if (!context.roles.includes(expectedRole)) {
    redirect(getWorkspaceHome(context.activeRole ?? context.roles[0]));
  }

  return context;
}

export async function assertActionRole(expectedRole: UserRole) {
  const context = await getAuthContext();

  if (!context.configured) {
    return;
  }

  if (!context.userId || !context.roles.includes(expectedRole)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
