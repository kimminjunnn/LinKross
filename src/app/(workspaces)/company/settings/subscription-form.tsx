"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, XCircle } from "lucide-react";

import { upsertCompanySubscriptionAction } from "@/app/actions/subscriptions";
import { formatProjectRange, getSubscriptionPlanTier, SUBSCRIPTION_PLAN_TIERS } from "@/config/subscription-plan";
import { subscriptionStatusLabel } from "@/config/subscription-status";
import type { CompanySubscriptionOverview } from "@/lib/backend";

export function SubscriptionForm({ overview }: { overview: CompanySubscriptionOverview }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { subscription, projectCount, recommendedPlanId } = overview;
  const isSubscribedToRecommended = subscription?.planId === recommendedPlanId && subscription.status === "active";

  function subscribeToRecommended() {
    startTransition(async () => {
      const result = await upsertCompanySubscriptionAction({ planId: recommendedPlanId, status: "active" });
      setMessage(result.ok ? "구독 정보를 갱신했습니다." : result.error.message);
    });
  }

  function cancelSubscription() {
    if (!subscription) return;
    startTransition(async () => {
      const result = await upsertCompanySubscriptionAction({ planId: subscription.planId, status: "cancelled" });
      setMessage(result.ok ? "구독을 해지했습니다." : result.error.message);
    });
  }

  return (
    <section className="mt-5 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <h2 className="font-semibold text-app-foreground">구독 플랜</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        구독 플랜 정보 (결제 연동 없음 — 추후 안내 예정). 진행 중인 프로젝트 개수에 따라 플랜과 금액이 달라집니다.
      </p>

      <div className="mt-4 rounded-control border border-app-border-strong bg-app-surface-subtle p-4">
        <p className="text-xs font-semibold tracking-wide text-app-muted uppercase">현재 구독 중인 상품</p>
        {subscription ? (
          <>
            <p className="mt-1 text-lg font-semibold text-app-foreground">
              {getSubscriptionPlanTier(subscription.planId).name} · {subscription.amount.toLocaleString()}원/월
            </p>
            <p className="mt-1 text-sm text-app-muted">상태: {subscriptionStatusLabel[subscription.status]}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-app-muted">아직 구독을 시작하지 않았습니다.</p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {SUBSCRIPTION_PLAN_TIERS.map((tier) => {
          const isRecommended = tier.id === recommendedPlanId;
          const isCurrent = subscription?.planId === tier.id && subscription.status === "active";
          return (
            <div
              key={tier.id}
              className={`rounded-control border p-4 ${isRecommended ? "border-brand-500 bg-brand-50" : "border-app-border-strong bg-app-surface"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-app-foreground">{tier.name}</p>
                {isCurrent ? (
                  <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-700">이용 중</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-app-muted">{formatProjectRange(tier)}</p>
              <p className="mt-2 text-lg font-bold text-app-foreground">
                {tier.monthlyPrice.toLocaleString()}원<span className="text-xs font-normal text-app-muted">/월</span>
              </p>
              {isRecommended ? (
                <p className="mt-1 text-[11px] font-semibold text-brand-700">현재 프로젝트 {projectCount}개 기준 추천</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {message && <p className="mt-4 text-sm text-app-muted">{message}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {!isSubscribedToRecommended && (
          <button
            type="button"
            disabled={pending}
            onClick={subscribeToRecommended}
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {subscription ? "추천 플랜으로 갱신" : "구독 시작하기"}
          </button>
        )}
        {subscription?.status === "active" && (
          <button
            type="button"
            disabled={pending}
            onClick={cancelSubscription}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-app-border-strong px-5 text-sm font-semibold text-app-foreground disabled:opacity-50"
          >
            <XCircle className="size-4" />해지
          </button>
        )}
      </div>
    </section>
  );
}
