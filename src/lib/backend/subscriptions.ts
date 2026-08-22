import { getSubscriptionPlanTier, resolveSubscriptionPlanTier, SUBSCRIPTION_PLAN_TIERS } from "@/config/subscription-plan";
import type { BackendResult, CompanySubscriptionOverview, UpsertSubscriptionInput } from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PLAN_IDS = SUBSCRIPTION_PLAN_TIERS.map((tier) => tier.id);

function startOfCurrentMonthIso(): string {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  return startOfMonth.toISOString();
}

export async function getCompanySubscriptionOverview(): Promise<BackendResult<CompanySubscriptionOverview>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const [{ data: subscriptionRow, error: subscriptionError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, plan_id, status, amount, currency, period_start_at, period_end_at")
      .eq("company_id", authData.user.id)
      .maybeSingle(),
    supabase.from("projects").select("id").eq("company_id", authData.user.id),
  ]);
  if (subscriptionError) return { ok: false, error: mapBackendError(subscriptionError, "구독 정보를 불러오지 못했습니다.") };
  if (projectsError) return { ok: false, error: mapBackendError(projectsError, "프로젝트 목록을 확인하지 못했습니다.") };

  const projectIds = (projects ?? []).map((project) => project.id);
  const { count: verificationRunCount, error: verificationRunCountError } = projectIds.length
    ? await supabase
        .from("verification_runs")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .gte("queued_at", startOfCurrentMonthIso())
    : { count: 0, error: null };
  if (verificationRunCountError) return { ok: false, error: mapBackendError(verificationRunCountError, "검수 실행 횟수를 확인하지 못했습니다.") };

  const resolvedRunCount = verificationRunCount ?? 0;
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
      monthlyVerificationRunCount: resolvedRunCount,
      recommendedPlanId: resolveSubscriptionPlanTier(resolvedRunCount).id,
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
