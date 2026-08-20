import type { CommissionChargeStatus } from "@/lib/backend/contracts";

// commission_rate 트리거 기본값(fix_add_commission_and_subscription.sql)과 반드시 동일하게 유지.
export const COMMISSION_RATE = 0.07;
// commission_vat_rate 트리거 기본값(fix_add_commission_vat.sql)과 반드시 동일하게 유지.
// LinKross는 아직 사업자등록 전이라 실제 과세 근거는 없다 — 일반과세자를 가정한 가안(假案) 표시용 수치.
export const COMMISSION_VAT_RATE = 0.1;
// private.has_grace_expired_commission 호출 시 이 값을 파라미터로 전달한다.
export const COMMISSION_GRACE_DAYS = 14;

// 미납 수수료로 인한 실제 차단(새 지원 제한 / 마일스톤 제출 제한)을 켤지 여부.
// 지금은 팀이 직접 검수·QA하는 단계라 실수로 막히면 곤란해서 꺼둔다.
// 미납 표시·자진신고·대시보드 배너 등 추적 UI는 이 값과 무관하게 계속 동작한다.
// 실제 서비스로 켜야 할 때 true로 바꾸면 된다 — 앱 레벨 체크(proposals.ts, verification.ts)만 이 값을 본다.
export const COMMISSION_ENFORCEMENT_ENABLED = false;

export const commissionChargeStatuses = [
  { value: "pending", label: "미납" },
  { value: "paid", label: "납부 완료" },
  { value: "waived", label: "면제" },
] as const satisfies ReadonlyArray<{ value: CommissionChargeStatus; label: string }>;

export const commissionChargeStatusLabel: Record<CommissionChargeStatus, string> = Object.fromEntries(
  commissionChargeStatuses.map((status) => [status.value, status.label]),
) as Record<CommissionChargeStatus, string>;
