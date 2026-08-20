export type SubscriptionPlanId = "starter" | "growth" | "scale";

export interface SubscriptionPlanTier {
  id: SubscriptionPlanId;
  name: string;
  minProjects: number;
  maxProjects: number | null; // null = 무제한
  monthlyPrice: number;
}

// 프로젝트 개수 기준 구독 티어. 실제 결제 연동 없음 — 참고용 가격이다.
export const SUBSCRIPTION_PLAN_TIERS: readonly SubscriptionPlanTier[] = [
  { id: "starter", name: "Starter", minProjects: 0, maxProjects: 1, monthlyPrice: 49000 },
  { id: "growth", name: "Growth", minProjects: 2, maxProjects: 5, monthlyPrice: 99000 },
  { id: "scale", name: "Scale", minProjects: 6, maxProjects: null, monthlyPrice: 199000 },
];

export function resolveSubscriptionPlanTier(projectCount: number): SubscriptionPlanTier {
  return (
    SUBSCRIPTION_PLAN_TIERS.find(
      (tier) => projectCount >= tier.minProjects && (tier.maxProjects === null || projectCount <= tier.maxProjects),
    ) ?? SUBSCRIPTION_PLAN_TIERS[SUBSCRIPTION_PLAN_TIERS.length - 1]
  );
}

export function getSubscriptionPlanTier(planId: SubscriptionPlanId): SubscriptionPlanTier {
  return SUBSCRIPTION_PLAN_TIERS.find((tier) => tier.id === planId) ?? SUBSCRIPTION_PLAN_TIERS[0];
}

export function formatProjectRange(tier: SubscriptionPlanTier): string {
  if (tier.maxProjects === null) return `프로젝트 ${tier.minProjects}개 이상`;
  if (tier.minProjects === tier.maxProjects) return `프로젝트 ${tier.minProjects}개`;
  return `프로젝트 ${tier.minProjects}~${tier.maxProjects}개`;
}
