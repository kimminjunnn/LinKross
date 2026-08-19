import type { PaymentRecordStatus } from "@/lib/backend/contracts";

export const paymentStatuses = [
  { value: "requested", label: "지급 요청" },
  { value: "processing", label: "처리 중" },
  { value: "completed", label: "지급 완료" },
  { value: "failed", label: "지급 실패" },
] as const satisfies ReadonlyArray<{ value: PaymentRecordStatus; label: string }>;

export const paymentStatusLabel: Record<PaymentRecordStatus, string> = Object.fromEntries(
  paymentStatuses.map((status) => [status.value, status.label]),
) as Record<PaymentRecordStatus, string>;
