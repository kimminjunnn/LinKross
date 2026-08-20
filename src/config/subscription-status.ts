import type { SubscriptionStatus } from "@/lib/backend/contracts";

export const subscriptionStatuses = [
  { value: "active", label: "활성" },
  { value: "past_due", label: "연체" },
  { value: "cancelled", label: "해지" },
] as const satisfies ReadonlyArray<{ value: SubscriptionStatus; label: string }>;

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = Object.fromEntries(
  subscriptionStatuses.map((status) => [status.value, status.label]),
) as Record<SubscriptionStatus, string>;
