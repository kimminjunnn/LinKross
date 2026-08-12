import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireWorkspaceRole } from "@/lib/auth/workspace-access";

export default async function CompanyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireWorkspaceRole("company");

  return <WorkspaceShell workspace="company">{children}</WorkspaceShell>;
}
