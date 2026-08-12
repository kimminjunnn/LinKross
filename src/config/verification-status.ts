export const checklistStatusConfig = {
  not_submitted: { label: "미제출", tone: "neutral" },
  submitted: { label: "제출 완료", tone: "brand" },
  queued: { label: "대기", tone: "neutral" },
  running: { label: "검수 중", tone: "accent" },
  passed: { label: "통과", tone: "success" },
  failed: { label: "실패", tone: "danger" },
  needs_review: { label: "확인 필요", tone: "warning" },
  retest_required: { label: "재검수 필요", tone: "warning" },
} as const;

export type ChecklistStatus = keyof typeof checklistStatusConfig;

export const milestoneVerificationStatusConfig = {
  revision_required: { label: "수정 필요", tone: "danger" },
  ready: { label: "검수 준비 완료", tone: "brand" },
  submission_required: { label: "코드 제출 대기", tone: "warning" },
  approved: { label: "최종 승인", tone: "success" },
} as const;

export type MilestoneVerificationStatus =
  keyof typeof milestoneVerificationStatusConfig;

export const verificationTypeLabels = {
  automated_e2e: "자동 E2E",
  build: "빌드 확인",
  manual: "사람 확인",
  document: "문서 확인",
} as const;

export type VerificationType = keyof typeof verificationTypeLabels;
