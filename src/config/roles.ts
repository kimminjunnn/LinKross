export const userRoles = [
  { value: "company", label: "기업" },
  { value: "freelancer", label: "프리랜서" },
] as const;

export type UserRole = (typeof userRoles)[number]["value"];

export function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role.value === value);
}
