import type { PaymentMethod } from "@/lib/backend/contracts";

export const paymentMethods = [
  { value: "wallet_testnet", label: "지갑 송금 (Base 테스트넷, 자동 검증)" },
  { value: "bank_transfer", label: "계좌이체 (수동 확인)" },
  { value: "card", label: "카드 (수동 확인)" },
  { value: "other", label: "기타 (수동 확인)" },
] as const satisfies ReadonlyArray<{ value: PaymentMethod; label: string }>;

export const paymentMethodLabel: Record<PaymentMethod, string> = Object.fromEntries(
  paymentMethods.map((method) => [method.value, method.label]),
) as Record<PaymentMethod, string>;
