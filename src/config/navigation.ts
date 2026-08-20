export type WorkspaceRole = "company" | "freelancer";

export type NavigationIconName =
  | "badge-check"
  | "briefcase-business"
  | "folder-kanban"
  | "house"
  | "receipt"
  | "search"
  | "settings";

export type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIconName;
};

export type NavigationSection = {
  label: string;
  items: readonly NavigationItem[];
};

export const workspaceNavigation: Record<
  WorkspaceRole,
  readonly NavigationSection[]
> = {
  company: [
    {
      label: "Workspace",
      items: [
        {
          label: "프로젝트",
          href: "/company/projects",
          icon: "folder-kanban",
        },
        {
          label: "진행 전 프로젝트",
          href: "/company/assessments",
          icon: "badge-check",
        },
      ],
    },
    {
      label: "관리",
      items: [
        { label: "설정", href: "/company/settings", icon: "settings" },
      ],
    },
  ],
  freelancer: [
    {
      label: "Workspace",
      items: [
        { label: "Find projects", href: "/opportunities", icon: "search" },
        {
          label: "My projects",
          href: "/freelancer/projects",
          icon: "folder-kanban",
        },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Commissions", href: "/freelancer/commissions", icon: "receipt" },
        { label: "Settings", href: "/freelancer/settings", icon: "settings" },
      ],
    },
  ],
};
