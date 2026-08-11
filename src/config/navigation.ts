import { BadgeCheck, FolderKanban, Settings } from "lucide-react";

export const primaryNavigation = [
  {
    label: "프로젝트",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "진행 전 프로젝트",
    href: "/assessments",
    icon: BadgeCheck,
  },
] as const;

export const secondaryNavigation = [
  {
    label: "설정",
    href: "/settings",
    icon: Settings,
  },
] as const;
