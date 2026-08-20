import type { BackendResult, CommissionChargeRecord, MarkCommissionChargePaidInput } from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { isUuid } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProjectCommissionChargesByPayment(
  projectId: string,
): Promise<BackendResult<Record<string, { rate: number; amount: number; vatAmount: number; currency: string }>>> {
  if (!isUuid(projectId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data, error } = await supabase
    .from("commission_charges")
    .select("payment_id, commission_rate, commission_amount, vat_amount, currency")
    .eq("project_id", projectId);
  if (error) return { ok: false, error: mapBackendError(error, "수수료 청구 정보를 불러오지 못했습니다.") };

  const byPaymentId: Record<string, { rate: number; amount: number; vatAmount: number; currency: string }> = {};
  for (const charge of data ?? []) {
    byPaymentId[charge.payment_id] = {
      rate: Number(charge.commission_rate),
      amount: Number(charge.commission_amount),
      vatAmount: Number(charge.vat_amount),
      currency: charge.currency,
    };
  }
  return { ok: true, data: byPaymentId };
}

export async function listFreelancerCommissionCharges(): Promise<BackendResult<CommissionChargeRecord[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: charges, error } = await supabase
    .from("commission_charges")
    .select("id, project_id, milestone_record_id, payment_id, base_amount, commission_rate, commission_amount, vat_amount, currency, status, due_at, paid_at, paid_reference, created_at")
    .eq("freelancer_id", authData.user.id)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: mapBackendError(error, "수수료 청구 내역을 불러오지 못했습니다.") };
  if (!charges?.length) return { ok: true, data: [] };

  const projectIds = Array.from(new Set(charges.map((charge) => charge.project_id)));
  const milestoneIds = Array.from(new Set(charges.map((charge) => charge.milestone_record_id)));
  const [{ data: projects, error: projectError }, { data: milestones, error: milestoneError }] = await Promise.all([
    supabase.from("projects").select("id, title").in("id", projectIds),
    supabase.from("milestones").select("id, title").in("id", milestoneIds),
  ]);
  if (projectError || milestoneError) return { ok: false, error: mapBackendError(projectError ?? milestoneError, "수수료 청구 관련 프로젝트를 불러오지 못했습니다.") };

  const projectsById = new Map((projects ?? []).map((project) => [project.id, project.title]));
  const milestonesById = new Map((milestones ?? []).map((milestone) => [milestone.id, milestone.title]));

  return {
    ok: true,
    data: charges.map((charge) => ({
      id: charge.id,
      projectId: charge.project_id,
      projectTitle: projectsById.get(charge.project_id) ?? "-",
      milestoneId: charge.milestone_record_id,
      milestoneTitle: milestonesById.get(charge.milestone_record_id) ?? "-",
      paymentId: charge.payment_id,
      baseAmount: Number(charge.base_amount),
      commissionRate: Number(charge.commission_rate),
      commissionAmount: Number(charge.commission_amount),
      vatAmount: Number(charge.vat_amount),
      currency: charge.currency,
      status: charge.status,
      dueAt: charge.due_at,
      paidAt: charge.paid_at,
      paidReference: charge.paid_reference,
      createdAt: charge.created_at,
    })),
  };
}

export async function markCommissionChargePaid(
  input: MarkCommissionChargePaidInput,
): Promise<BackendResult<{ chargeId: string }>> {
  if (!isUuid(input.chargeId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 수수료 청구가 아닙니다." } };
  if (!input.paidReference.trim()) return { ok: false, error: { code: "INVALID_INPUT", message: "납부확인번호(계좌이체 메모, 영수증 번호 등)를 입력해주세요." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data, error } = await supabase
    .from("commission_charges")
    .update({ status: "paid", paid_at: new Date().toISOString(), paid_reference: input.paidReference.trim() })
    .eq("id", input.chargeId)
    .eq("freelancer_id", authData.user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: mapBackendError(error, "납부 완료로 표시할 수 있는 청구를 찾지 못했습니다.") };
  return { ok: true, data: { chargeId: data.id } };
}
