import {
  BadgeCheck,
  FileText,
  FolderKanban,
  Settings,
} from "lucide-react";

export const primaryNavigation = [
  {
    label: "프로젝트",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "AI 명세서",
    href: "/sow",
    icon: FileText,
  },
  {
    label: "지원자 검증",
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
