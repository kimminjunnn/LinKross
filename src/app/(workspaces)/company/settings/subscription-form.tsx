"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, XCircle } from "lucide-react";

import { upsertCompanySubscriptionAction } from "@/app/actions/subscriptions";
import { formatRunRange, getSubscriptionPlanTier, SUBSCRIPTION_PLAN_TIERS } from "@/config/subscription-plan";
import { subscriptionStatusLabel } from "@/config/subscription-status";
import type { CompanySubscriptionOverview, SubscriptionPlanId } from "@/lib/backend";

export function SubscriptionForm({ overview }: { overview: CompanySubscriptionOverview }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<SubscriptionPlanId | null>(null);
  const [pending, startTransition] = useTransition();
  const { subscription, monthlyVerificationRunCount, recommendedPlanId } = overview;
  const activePlanId = subscription?.status === "active" ? subscription.planId : null;
  // amount는 저장 시점 스냅샷이라 플랜 요금표가 바뀌면 옛 값이 남을 수 있다 —
  // 화면에는 항상 현재 요금표 기준 금액을 보여준다.
  const currentTier = subscription ? getSubscriptionPlanTier(subscription.planId) : null;

  function subscribeTo(planId: SubscriptionPlanId) {
    setPendingPlanId(planId);
    startTransition(async () => {
      const result = await upsertCompanySubscriptionAction({ planId, status: "active" });
      setMessage(result.ok ? "구독 정보를 갱신했습니다." : result.error.message);
      setPendingPlanId(null);
    });
  }

  function cancelSubscription() {
    if (!subscription) return;
    setPendingPlanId(null);
    startTransition(async () => {
      const result = await upsertCompanySubscriptionAction({ planId: subscription.planId, status: "cancelled" });
      setMessage(result.ok ? "구독을 해지했습니다." : result.error.message);
    });
  }

  return (
    <section className="mt-5 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <h2 className="font-semibold text-app-foreground">구독 플랜</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        프로젝트 등록·모집·SOW 협의는 구독 여부와 상관없이 무료로 이용할 수 있습니다. 실제로 돈이 드는 자동 검수 기능을 이번 달 몇 번 사용했는지에 따라 추천 플랜이 달라지며, 원하는 플랜을 직접 선택해 구독할 수 있습니다.
      </p>

      <div className="mt-4 rounded-control border border-app-border-strong bg-app-surface-subtle p-4">
        <p className="text-sm font-semibold text-app-foreground">현재 구독 중인 상품</p>
        {subscription && currentTier ? (
          <>
            <p className="mt-1 text-lg font-semibold text-app-foreground">
              {currentTier.name} · {currentTier.monthlyPrice.toLocaleString()}원/월
            </p>
            <p className="mt-1 text-sm text-app-muted">상태: {subscriptionStatusLabel[subscription.status]}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-app-muted">아직 구독을 시작하지 않았습니다.</p>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-app-muted">{message}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {SUBSCRIPTION_PLAN_TIERS.map((tier) => {
          const isRecommended = tier.id === recommendedPlanId;
          const isActive = activePlanId === tier.id;
          const isBusy = pending && pendingPlanId === tier.id;
          return (
            <div
              key={tier.id}
              className={`flex flex-col rounded-control border p-5 ${
                isRecommended ? "border-brand-500" : "border-app-border-strong"
              } bg-app-surface`}
            >
              {isRecommended ? (
                <span className="mb-2 text-xs font-semibold text-brand-700">
                  이번 달 검수 {monthlyVerificationRunCount}회 기준 추천
                </span>
              ) : null}
              <p className="font-semibold text-app-foreground">{tier.name}</p>
              <p className="mt-1 text-xs text-app-muted">{formatRunRange(tier)}</p>
              <p className="mt-3 text-2xl font-bold text-app-foreground">
                {tier.monthlyPrice.toLocaleString()}원<span className="text-xs font-normal text-app-muted">/월</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-app-muted">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-accent-600" />자동 검수 {formatRunRange(tier)}
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-accent-600" />프로젝트 등록·모집·SOW 협의는 무제한 무료
                </li>
              </ul>
              <button
                type="button"
                disabled={pending || isActive}
                onClick={() => subscribeTo(tier.id)}
                className={`mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold disabled:cursor-not-allowed ${
                  isActive
                    ? "border border-app-border-strong bg-app-surface-subtle text-app-muted"
                    : "primary-action"
                }`}
              >
                {isBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                {isActive ? "이용 중" : "이 플랜 구독하기"}
              </button>
            </div>
          );
        })}
      </div>

      {subscription?.status === "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={cancelSubscription}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-app-muted hover:text-danger disabled:opacity-50"
        >
          <XCircle className="size-4" />구독 해지
        </button>
      )}
    </section>
  );
}
