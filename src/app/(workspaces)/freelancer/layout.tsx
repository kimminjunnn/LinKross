import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireWorkspaceRole } from "@/lib/auth/workspace-access";

export default async function FreelancerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireWorkspaceRole("freelancer");

  return <WorkspaceShell workspace="freelancer">{children}</WorkspaceShell>;
}
