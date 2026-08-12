export const projectStatuses = {
  preparing: "착수 준비",
  inProgress: "진행 중",
  completed: "완료",
  cancelled: "취소",
} as const;

export type ProjectStatus = (typeof projectStatuses)[keyof typeof projectStatuses];

export function isProjectPreparing(status: ProjectStatus) {
  return status === projectStatuses.preparing;
}

export function isProjectReadOnly(status: ProjectStatus) {
  return status === projectStatuses.completed || status === projectStatuses.cancelled;
}

export type MilestoneDecisionStatus =
  | "pending"
  | "revision_required"
  | "approved";

export function canChangeMilestoneTerms(status: MilestoneDecisionStatus) {
  return status !== "approved";
}
