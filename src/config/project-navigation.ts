import { isProjectPreparing, type ProjectStatus } from "@/config/project-lifecycle";

const sowTab = { label: "업무 명세서", segment: "sow" } as const;
const approvalTab = { label: "승인", segment: "approval" } as const;
const verificationTab = {
  label: "마일스톤 · 검수",
  segment: "verification",
} as const;
const evidenceTab = { label: "지급 · 증빙", segment: "evidence" } as const;

export const projectTabs = [sowTab, approvalTab, verificationTab, evidenceTab] as const;

const preparingProjectTabs = [sowTab, approvalTab] as const;
const deliveryProjectTabs = [sowTab, verificationTab, evidenceTab] as const;

export type ProjectTabSegment = (typeof projectTabs)[number]["segment"];

export function getProjectTabs(status: ProjectStatus) {
  return isProjectPreparing(status) ? preparingProjectTabs : deliveryProjectTabs;
}

export function getDefaultProjectTabSegment(status: ProjectStatus): ProjectTabSegment {
  return getProjectTabs(status)[0].segment;
}

export function isProjectTabAvailable(
  status: ProjectStatus,
  segment: ProjectTabSegment,
) {
  return getProjectTabs(status).some((tab) => tab.segment === segment);
}
