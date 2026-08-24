export type SubscriptionPlanId = "starter" | "growth" | "scale";

export interface SubscriptionPlanTier {
  id: SubscriptionPlanId;
  name: string;
  minRuns: number;
  maxRuns: number | null; // null = 무제한
  monthlyPrice: number;
}

// 이번 달 검수(자동 검증) 실행 횟수 기준 구독 티어. 실제 결제 연동 없음 — 참고용 가격이다.
// 첫 허들을 낮추기 위해 프로젝트 등록·모집·SOW 협의는 구독 여부와 무관하게 전부 무료로 쓸 수 있고,
// 실제로 돈이 드는 자동 검수 기능을 얼마나 쓰는지에 따라서만 요금이 달라진다.
export const SUBSCRIPTION_PLAN_TIERS: readonly SubscriptionPlanTier[] = [
  { id: "starter", name: "Starter", minRuns: 0, maxRuns: 60, monthlyPrice: 49000 },
  { id: "growth", name: "Growth", minRuns: 61, maxRuns: 180, monthlyPrice: 79000 },
  { id: "scale", name: "Scale", minRuns: 181, maxRuns: null, monthlyPrice: 129000 },
];

export function resolveSubscriptionPlanTier(monthlyVerificationRunCount: number): SubscriptionPlanTier {
  return (
    SUBSCRIPTION_PLAN_TIERS.find(
      (tier) => monthlyVerificationRunCount >= tier.minRuns && (tier.maxRuns === null || monthlyVerificationRunCount <= tier.maxRuns),
    ) ?? SUBSCRIPTION_PLAN_TIERS[SUBSCRIPTION_PLAN_TIERS.length - 1]
  );
}

export function getSubscriptionPlanTier(planId: SubscriptionPlanId): SubscriptionPlanTier {
  return SUBSCRIPTION_PLAN_TIERS.find((tier) => tier.id === planId) ?? SUBSCRIPTION_PLAN_TIERS[0];
}

export function formatRunRange(tier: SubscriptionPlanTier): string {
  if (tier.maxRuns === null) return `검수 월 ${tier.minRuns}회 이상`;
  if (tier.minRuns === tier.maxRuns) return `검수 월 ${tier.minRuns}회`;
  return `검수 월 ${tier.minRuns}~${tier.maxRuns}회`;
}
