import type { BackendResult, SubscriptionRecord, UpsertSubscriptionInput } from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCompanySubscription(): Promise<BackendResult<SubscriptionRecord | null>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, status, amount, currency, period_start_at, period_end_at")
    .eq("company_id", authData.user.id)
    .maybeSingle();
  if (error) return { ok: false, error: mapBackendError(error, "구독 정보를 불러오지 못했습니다.") };
  if (!data) return { ok: true, data: null };
  return {
    ok: true,
    data: {
      id: data.id,
      status: data.status,
      amount: Number(data.amount),
      currency: data.currency,
      periodStartAt: data.period_start_at,
      periodEndAt: data.period_end_at,
    },
  };
}

export async function upsertCompanySubscription(
  input: UpsertSubscriptionInput,
): Promise<BackendResult<{ subscriptionId: string }>> {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "구독 금액이 올바르지 않습니다." } };
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        company_id: authData.user.id,
        amount: input.amount,
        currency: input.currency?.trim() || "KRW",
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
