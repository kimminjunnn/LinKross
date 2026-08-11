export const paymentStatuses = [
  { value: "requested", label: "지급 요청" },
  { value: "processing", label: "처리 중" },
  { value: "completed", label: "지급 완료" },
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number]["value"];
