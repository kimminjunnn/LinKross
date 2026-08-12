import type { UserRole } from "@/config/roles";

export const DEFAULT_AUTHENTICATED_PATH = "/";

export function getDefaultPathForRole(role: UserRole) {
  return role === "company" ? "/company" : "/freelancer";
}

export function getSafeInternalPath(
  value: string | null,
  fallback = DEFAULT_AUTHENTICATED_PATH,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const baseUrl = new URL("https://linkross.local");
    const targetUrl = new URL(value, baseUrl);

    if (targetUrl.origin !== baseUrl.origin) {
      return fallback;
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return fallback;
  }
}

export function getSafePathForRole(value: string | null, role: UserRole) {
  const fallback = getDefaultPathForRole(role);
  const path = getSafeInternalPath(value, fallback);
  const rolePrefix = role === "company" ? "/company" : "/freelancer";

  if (
    path === rolePrefix ||
    path.startsWith(`${rolePrefix}/`) ||
    path === "/opportunities" ||
    path.startsWith("/opportunities/")
  ) {
    return path;
  }

  return fallback;
}
