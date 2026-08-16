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

const LIFECYCLE_STAGE_TO_STATUS: Record<string, ProjectStatus> = {
  preparing: projectStatuses.preparing,
  in_progress: projectStatuses.inProgress,
  completed: projectStatuses.completed,
  cancelled: projectStatuses.cancelled,
  archived: projectStatuses.completed,
};

export function mapLifecycleStageToProjectStatus(lifecycleStage: string): ProjectStatus {
  return LIFECYCLE_STAGE_TO_STATUS[lifecycleStage] ?? projectStatuses.preparing;
}

export type MilestoneDecisionStatus =
  | "pending"
  | "revision_required"
  | "approved";

export function canChangeMilestoneTerms(status: MilestoneDecisionStatus) {
  return status !== "approved";
}
