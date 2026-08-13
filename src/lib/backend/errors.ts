import type { BackendError } from "@/lib/backend/contracts";

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

export function mapBackendError(
  error: SupabaseErrorLike | null | undefined,
  fallback = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
): BackendError {
  const code = error?.code ?? "";
  const message = error?.message ?? "";

  if (message.includes("AUTHENTICATION_REQUIRED")) {
    return { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." };
  }

  if (
    code === "42501" ||
    message.includes("OWNER_REQUIRED") ||
    message.includes("ROLE_REQUIRED") ||
    message.includes("PARTICIPANT_REQUIRED")
  ) {
    return { code: "FORBIDDEN", message: "이 작업을 수행할 권한이 없습니다." };
  }

  if (message.includes("RECRUITMENT_NOT_OPEN")) {
    return { code: "RECRUITMENT_CLOSED", message: "현재 제안서를 제출할 수 없는 모집입니다." };
  }

  if (code === "23505") {
    if (message.includes("proposals_project_id_freelancer_id")) {
      return { code: "DUPLICATE_PROPOSAL", message: "이미 이 프로젝트에 제안서를 제출했습니다." };
    }

    if (message.includes("selections_project_id")) {
      return { code: "PROJECT_ALREADY_SELECTED", message: "이미 프리랜서 선정이 완료된 프로젝트입니다." };
    }

    return { code: "CONFLICT", message: "이미 처리된 요청입니다." };
  }

  if (code === "23503" || message.includes("NOT_FOUND")) {
    return { code: "NOT_FOUND", message: "대상을 찾을 수 없거나 현재 상태에서 처리할 수 없습니다." };
  }

  return { code: "DATABASE_ERROR", message: fallback };
}
