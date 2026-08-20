import { getSubscriptionPlanTier, resolveSubscriptionPlanTier, SUBSCRIPTION_PLAN_TIERS } from "@/config/subscription-plan";
import type { BackendResult, CompanySubscriptionOverview, UpsertSubscriptionInput } from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PLAN_IDS = SUBSCRIPTION_PLAN_TIERS.map((tier) => tier.id);

export async function getCompanySubscriptionOverview(): Promise<BackendResult<CompanySubscriptionOverview>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const [{ data: subscriptionRow, error: subscriptionError }, { count: projectCount, error: projectCountError }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, plan_id, status, amount, currency, period_start_at, period_end_at")
      .eq("company_id", authData.user.id)
      .maybeSingle(),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", authData.user.id),
  ]);
  if (subscriptionError) return { ok: false, error: mapBackendError(subscriptionError, "구독 정보를 불러오지 못했습니다.") };
  if (projectCountError) return { ok: false, error: mapBackendError(projectCountError, "프로젝트 개수를 확인하지 못했습니다.") };

  const resolvedProjectCount = projectCount ?? 0;
  return {
    ok: true,
    data: {
      subscription: subscriptionRow
        ? {
            id: subscriptionRow.id,
            planId: subscriptionRow.plan_id,
            status: subscriptionRow.status,
            amount: Number(subscriptionRow.amount),
            currency: subscriptionRow.currency,
            periodStartAt: subscriptionRow.period_start_at,
            periodEndAt: subscriptionRow.period_end_at,
          }
        : null,
      projectCount: resolvedProjectCount,
      recommendedPlanId: resolveSubscriptionPlanTier(resolvedProjectCount).id,
    },
  };
}

export async function upsertCompanySubscription(
  input: UpsertSubscriptionInput,
): Promise<BackendResult<{ subscriptionId: string }>> {
  if (!PLAN_IDS.includes(input.planId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 구독 플랜이 아닙니다." } };
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const tier = getSubscriptionPlanTier(input.planId);
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        company_id: authData.user.id,
        plan_id: tier.id,
        amount: tier.monthlyPrice,
        currency: "KRW",
        status: input.status ?? "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: mapBackendError(error, "구독 정보를 저장하지 못했습니다.") };
  return { ok: true, data: { subscriptionId: data.id } };
}
