"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";

import { upsertCompanySubscriptionAction } from "@/app/actions/subscriptions";
import { subscriptionStatusLabel } from "@/config/subscription-status";
import type { SubscriptionRecord } from "@/lib/backend";

export function SubscriptionForm({ initialSubscription }: { initialSubscription: SubscriptionRecord | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(async () => {
        const result = await upsertCompanySubscriptionAction({
          amount: Number(formData.get("amount") ?? 0),
        });
        setMessage(result.ok ? "구독 정보를 저장했습니다." : result.error.message);
      })}
      className="mt-5 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6"
    >
      <h2 className="font-semibold text-app-foreground">구독 플랜 정보</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        구독 플랜 정보 (결제 연동 없음 — 추후 안내 예정). 현재 상태:{" "}
        <span className="font-semibold text-app-foreground">
          {initialSubscription ? subscriptionStatusLabel[initialSubscription.status] : "미등록"}
        </span>
      </p>
      <label className="mt-4 block text-sm text-app-foreground">
        월 구독료 (KRW)
        <input
          name="amount"
          type="number"
          min={0}
          step={1000}
          defaultValue={initialSubscription?.amount ?? 0}
          className="mt-2 min-h-11 w-full max-w-xs rounded-control border border-app-border-strong px-3 text-sm"
        />
      </label>
      {message && <p className="mt-4 text-sm text-app-muted">{message}</p>}
      <button disabled={pending} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}저장
      </button>
    </form>
  );
}
