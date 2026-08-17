import type {
  BackendResult,
  InvoiceRecord,
  ProjectFinancialWorkspace,
  ReviewInvoiceInput,
  SubmitInvoiceInput,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { isUuid } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listFreelancerInvoices(): Promise<BackendResult<InvoiceRecord[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, project_id, milestone_id, invoice_number, status, amount, currency, external_reference, submitted_at, reviewed_at, review_note")
    .eq("submitted_by", authData.user.id)
    .order("submitted_at", { ascending: false });
  if (error) return { ok: false, error: mapBackendError(error, "인보이스를 불러오지 못했습니다.") };
  if (!invoices?.length) return { ok: true, data: [] };

  const projectIds = Array.from(new Set(invoices.map((invoice) => invoice.project_id)));
  const milestoneIds = Array.from(new Set(invoices.map((invoice) => invoice.milestone_id)));
  const [{ data: projects, error: projectError }, { data: milestones, error: milestoneError }] = await Promise.all([
    supabase.from("projects").select("id, title, company_id").in("id", projectIds),
    supabase.from("milestones").select("id, code, title").in("id", milestoneIds),
  ]);
  if (projectError || milestoneError) return { ok: false, error: mapBackendError(projectError ?? milestoneError, "인보이스 프로젝트를 불러오지 못했습니다.") };

  const companyIds = Array.from(new Set((projects ?? []).map((project) => project.company_id)));
  const { data: companies, error: companyError } = companyIds.length
    ? await supabase.from("company_profiles").select("id, organization_name").in("id", companyIds)
    : { data: [], error: null };
  if (companyError) return { ok: false, error: mapBackendError(companyError, "발주사 정보를 불러오지 못했습니다.") };

  const projectsById = new Map((projects ?? []).map((project) => [project.id, project]));
  const milestonesById = new Map((milestones ?? []).map((milestone) => [milestone.id, milestone]));
  const companiesById = new Map((companies ?? []).map((company) => [company.id, company.organization_name]));
  return {
    ok: true,
    data: invoices.map((invoice) => toInvoice(
      invoice,
      projectsById.get(invoice.project_id)?.title ?? "접근이 종료된 프로젝트",
      companiesById.get(projectsById.get(invoice.project_id)?.company_id ?? "") ?? "발주사",
      milestonesById.get(invoice.milestone_id),
    )),
  };
}

export async function getProjectFinancialWorkspace(projectId: string): Promise<BackendResult<ProjectFinancialWorkspace>> {
  if (!isUuid(projectId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: project, error: projectError } = await supabase.from("projects").select("id, title").eq("id", projectId).maybeSingle();
  if (projectError || !project) return { ok: false, error: mapBackendError(projectError, "프로젝트를 찾지 못했습니다.") };

  const { data: sow } = await supabase.from("sow_versions").select("id").eq("project_id", projectId).eq("status", "approved").maybeSingle();
  if (!sow) return { ok: true, data: { projectId, projectTitle: project.title, milestones: [], evidenceBundles: [] } };

  const { data: milestones, error: milestoneError } = await supabase
    .from("milestones")
    .select("id, code, title, amount, currency, status, position")
    .eq("sow_version_id", sow.id)
    .order("position", { ascending: true });
  if (milestoneError) return { ok: false, error: mapBackendError(milestoneError, "마일스톤을 불러오지 못했습니다.") };
  const milestoneIds = (milestones ?? []).map((milestone) => milestone.id);

  const [decisionsResult, invoicesResult, paymentsResult, bundlesResult] = await Promise.all([
    milestoneIds.length ? supabase.from("milestone_decisions").select("milestone_id, decided_at").eq("decision", "approved").in("milestone_id", milestoneIds) : Promise.resolve({ data: [], error: null }),
    milestoneIds.length ? supabase.from("invoices").select("id, project_id, milestone_id, invoice_number, status, amount, currency, external_reference, submitted_at, reviewed_at, review_note").in("milestone_id", milestoneIds).order("submitted_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    milestoneIds.length ? supabase.from("payments").select("id, milestone_record_id, invoice_id, status, amount_usdc, currency, tx_hash, requested_at, processing_at, completed_at, verified_at").eq("project_id", projectId).in("milestone_record_id", milestoneIds).order("verified_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    supabase.from("evidence_bundles").select("id, version_number, status, storage_path, sha256, requested_at, completed_at, error_message").eq("project_id", projectId).order("version_number", { ascending: false }),
  ]);
  const firstError = decisionsResult.error ?? invoicesResult.error ?? paymentsResult.error ?? bundlesResult.error;
  if (firstError) return { ok: false, error: mapBackendError(firstError, "지급 및 증빙 정보를 불러오지 못했습니다.") };

  const decisionByMilestone = new Map((decisionsResult.data ?? []).map((decision) => [decision.milestone_id, decision.decided_at]));
  const invoiceByMilestone = firstBy(invoicesResult.data ?? [], "milestone_id");
  const paymentByMilestone = firstBy(paymentsResult.data ?? [], "milestone_record_id");

  return {
    ok: true,
    data: {
      projectId,
      projectTitle: project.title,
      milestones: (milestones ?? []).map((milestone) => {
        const invoice = invoiceByMilestone.get(milestone.id);
        const payment = paymentByMilestone.get(milestone.id);
        return {
          id: milestone.id,
          code: milestone.code,
          title: milestone.title,
          amount: Number(milestone.amount),
          currency: milestone.currency,
          status: milestone.status,
          approvedAt: decisionByMilestone.get(milestone.id) ?? null,
          invoice: invoice ? toInvoice(invoice, project.title, "", milestone) : null,
          payment: payment ? {
            id: payment.id,
            status: payment.status,
            amount: Number(payment.amount_usdc),
            currency: payment.currency,
            externalReference: payment.tx_hash || null,
            requestedAt: payment.requested_at,
            processingAt: payment.processing_at,
            completedAt: payment.completed_at,
          } : null,
        };
      }),
      evidenceBundles: (bundlesResult.data ?? []).map((bundle) => ({
        id: bundle.id,
        versionNumber: bundle.version_number,
        status: bundle.status,
        storagePath: bundle.storage_path,
        sha256: bundle.sha256,
        requestedAt: bundle.requested_at,
        completedAt: bundle.completed_at,
        errorMessage: bundle.error_message,
      })),
    },
  };
}

export async function submitInvoice(input: SubmitInvoiceInput): Promise<BackendResult<{ invoiceId: string }>> {
  if (!isUuid(input.projectId) || !isUuid(input.milestoneId) || !input.invoiceNumber.trim()) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "프로젝트, 마일스톤, 인보이스 번호를 확인해주세요." } };
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  const { data: milestone, error: milestoneError } = await supabase.from("milestones").select("id, amount, currency, status").eq("id", input.milestoneId).eq("project_id", input.projectId).maybeSingle();
  if (milestoneError || !milestone) return { ok: false, error: mapBackendError(milestoneError, "마일스톤을 찾지 못했습니다.") };
  if (milestone.status !== "approved") return { ok: false, error: { code: "CONFLICT", message: "발주자가 승인한 마일스톤만 인보이스를 제출할 수 있습니다." } };
  const { data, error } = await supabase.from("invoices").insert({
    project_id: input.projectId,
    milestone_id: input.milestoneId,
    invoice_number: input.invoiceNumber.trim(),
    amount: milestone.amount,
    currency: milestone.currency,
    external_reference: input.externalReference?.trim() || null,
    submitted_by: authData.user.id,
  }).select("id").single();
  if (error || !data) return { ok: false, error: mapBackendError(error, "인보이스를 제출하지 못했습니다.") };
  return { ok: true, data: { invoiceId: data.id } };
}

export async function reviewInvoice(input: ReviewInvoiceInput): Promise<BackendResult<{ invoiceId: string }>> {
  if (!isUuid(input.projectId) || !isUuid(input.invoiceId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 인보이스가 아닙니다." } };
  if (input.status === "rejected" && !input.reviewNote?.trim()) return { ok: false, error: { code: "INVALID_INPUT", message: "반려 사유를 입력해주세요." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  const { data, error } = await supabase.from("invoices").update({ status: input.status, reviewed_by: authData.user.id, reviewed_at: new Date().toISOString(), review_note: input.reviewNote?.trim() || null }).eq("id", input.invoiceId).eq("project_id", input.projectId).eq("status", "submitted").select("id").maybeSingle();
  if (error || !data) return { ok: false, error: mapBackendError(error, "검토 가능한 인보이스를 찾지 못했습니다.") };
  return { ok: true, data: { invoiceId: data.id } };
}

function firstBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Map<string, T> {
  const result = new Map<string, T>();
  for (const row of rows) if (!result.has(String(row[key]))) result.set(String(row[key]), row);
  return result;
}

function toInvoice(row: {
  id: string; project_id: string; milestone_id: string; invoice_number: string; status: InvoiceRecord["status"];
  amount: number; currency: string; external_reference: string | null; submitted_at: string; reviewed_at: string | null; review_note: string | null;
}, projectTitle: string, organizationName: string, milestone?: { code: string; title: string }): InvoiceRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle,
    organizationName,
    milestoneId: row.milestone_id,
    milestoneCode: milestone?.code ?? "-",
    milestoneTitle: milestone?.title ?? "마일스톤",
    invoiceNumber: row.invoice_number,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    externalReference: row.external_reference,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
  };
}
