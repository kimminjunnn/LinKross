import type {
  BackendError,
  CreateProjectInput,
  SelectProposalInput,
  SubmitProposalInput,
} from "@/lib/backend/contracts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function validateCreateProject(input: CreateProjectInput): BackendError | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.title.trim()) fieldErrors.title = "프로젝트명을 입력해주세요.";
  if (!input.goal.trim()) fieldErrors.goal = "프로젝트 목표를 입력해주세요.";
  if (!input.requirements.trim()) fieldErrors.requirements = "핵심 요구사항을 입력해주세요.";
  if (!Number.isFinite(input.budgetAmount) || input.budgetAmount < 0) {
    fieldErrors.budgetAmount = "예산은 0 이상의 숫자여야 합니다.";
  }
  if (input.budgetMaxAmount != null && input.budgetMaxAmount < input.budgetAmount) {
    fieldErrors.budgetMaxAmount = "최대 예산은 최소 예산보다 작을 수 없습니다.";
  }
  if (!isDateOnly(input.startDate)) fieldErrors.startDate = "올바른 시작일을 입력해주세요.";
  if (!isDateOnly(input.endDate)) fieldErrors.endDate = "올바른 완료일을 입력해주세요.";
  if (isDateOnly(input.startDate) && isDateOnly(input.endDate) && input.endDate < input.startDate) {
    fieldErrors.endDate = "완료일은 시작일보다 빠를 수 없습니다.";
  }
  if (!isTimestamp(input.recruitmentStartAt)) {
    fieldErrors.recruitmentStartAt = "올바른 모집 시작 시각을 입력해주세요.";
  }
  if (!isTimestamp(input.recruitmentEndAt)) {
    fieldErrors.recruitmentEndAt = "올바른 모집 마감 시각을 입력해주세요.";
  }
  if (
    isTimestamp(input.recruitmentStartAt) &&
    isTimestamp(input.recruitmentEndAt) &&
    Date.parse(input.recruitmentEndAt) <= Date.parse(input.recruitmentStartAt)
  ) {
    fieldErrors.recruitmentEndAt = "모집 마감은 모집 시작 이후여야 합니다.";
  }

  return Object.keys(fieldErrors).length
    ? { code: "INVALID_INPUT", message: "입력 내용을 확인해주세요.", fieldErrors }
    : null;
}

export function validateSubmitProposal(input: SubmitProposalInput): BackendError | null {
  const fieldErrors: Record<string, string> = {};
  if (!isUuid(input.projectId)) fieldErrors.projectId = "올바른 프로젝트 ID가 아닙니다.";
  if (!input.content.trim()) fieldErrors.content = "수행 제안서 내용을 입력해주세요.";

  return Object.keys(fieldErrors).length
    ? { code: "INVALID_INPUT", message: "입력 내용을 확인해주세요.", fieldErrors }
    : null;
}

export function validateSelectProposal(input: SelectProposalInput): BackendError | null {
  if (!isUuid(input.projectId) || !isUuid(input.proposalId)) {
    return { code: "INVALID_INPUT", message: "올바른 프로젝트와 제안서를 선택해주세요." };
  }
  return null;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isTimestamp(value: string) {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}
