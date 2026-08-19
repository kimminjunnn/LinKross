import { createHash } from "node:crypto";

import type {
  AdvancePaymentStatusInput,
  BackendResult,
  EvidenceBundleDetail,
  GenerateEvidenceBundleOutput,
  InvoiceRecord,
  ProjectFinancialWorkspace,
  RequestPaymentInput,
  ReviewInvoiceInput,
  SubmitInvoiceInput,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { translateToEnglish } from "@/lib/backend/translation";
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
  const mappedInvoices = await Promise.all(
    invoices.map((invoice) =>
      toInvoice(
        invoice,
        projectsById.get(invoice.project_id)?.title ?? "접근이 종료된 프로젝트",
        companiesById.get(projectsById.get(invoice.project_id)?.company_id ?? "") ?? "발주사",
        milestonesById.get(invoice.milestone_id),
        true,
      )
    )
  );
  return {
    ok: true,
    data: mappedInvoices,
  };
}

export async function getProjectFinancialWorkspace(projectId: string): Promise<BackendResult<ProjectFinancialWorkspace>> {
  if (!isUuid(projectId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: project, error: projectError } = await supabase.from("projects").select("id, title, company_id, lifecycle_stage").eq("id", projectId).maybeSingle();
  if (projectError || !project) return { ok: false, error: mapBackendError(projectError, "프로젝트를 찾지 못했습니다.") };

  const { data: sow } = await supabase.from("sow_versions").select("id").eq("project_id", projectId).eq("status", "approved").maybeSingle();
  if (!sow) return { ok: true, data: { projectId, projectTitle: project.title, lifecycleStage: project.lifecycle_stage, milestones: [], evidenceBundles: [] } };

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

  const isCompany = project.company_id === authData.user.id;
  const shouldTranslate = !isCompany;

  const mappedMilestones = await Promise.all(
    (milestones ?? []).map(async (milestone) => {
      const invoice = invoiceByMilestone.get(milestone.id);
      const payment = paymentByMilestone.get(milestone.id);
      const title = shouldTranslate ? await translateToEnglish(milestone.title) : milestone.title;
      const mappedInvoice = invoice ? await toInvoice(invoice, project.title, "", milestone, shouldTranslate) : null;
      return {
        id: milestone.id,
        code: milestone.code,
        title,
        amount: Number(milestone.amount),
        currency: milestone.currency,
        status: milestone.status,
        approvedAt: decisionByMilestone.get(milestone.id) ?? null,
        invoice: mappedInvoice,
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
    })
  );

  return {
    ok: true,
    data: {
      projectId,
      projectTitle: project.title,
      lifecycleStage: project.lifecycle_stage,
      milestones: mappedMilestones,
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

export async function requestPayment(input: RequestPaymentInput): Promise<BackendResult<{ paymentId: string }>> {
  if (!isUuid(input.projectId) || !isUuid(input.milestoneId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트/마일스톤이 아닙니다." } };
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, amount, currency, status")
    .eq("project_id", input.projectId)
    .eq("milestone_id", input.milestoneId)
    .eq("status", "approved")
    .maybeSingle();
  if (invoiceError || !invoice) return { ok: false, error: mapBackendError(invoiceError, "승인된 인보이스가 있는 마일스톤만 지급을 요청할 수 있습니다.") };

  const { data: existingPayment } = await supabase.from("payments").select("id").eq("invoice_id", invoice.id).maybeSingle();
  if (existingPayment) return { ok: false, error: { code: "CONFLICT", message: "이미 지급 기록이 있는 인보이스입니다." } };

  const { data, error } = await supabase.from("payments").insert({
    project_id: input.projectId,
    milestone_record_id: input.milestoneId,
    invoice_id: invoice.id,
    status: "requested",
    amount_usdc: invoice.amount,
    currency: invoice.currency,
    requested_at: new Date().toISOString(),
    verified_by: authData.user.id,
  }).select("id").single();
  if (error || !data) return { ok: false, error: mapBackendError(error, "지급 요청을 생성하지 못했습니다.") };
  return { ok: true, data: { paymentId: data.id } };
}

const NEXT_PAYMENT_STATUS: Record<string, string[]> = {
  requested: ["processing", "completed", "failed"],
  processing: ["completed", "failed"],
};

export async function advancePaymentStatus(input: AdvancePaymentStatusInput): Promise<BackendResult<{ paymentId: string }>> {
  if (!isUuid(input.projectId) || !isUuid(input.paymentId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 지급 기록이 아닙니다." } };
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: payment, error: paymentError } = await supabase.from("payments").select("id, status").eq("id", input.paymentId).eq("project_id", input.projectId).maybeSingle();
  if (paymentError || !payment) return { ok: false, error: mapBackendError(paymentError, "지급 기록을 찾지 못했습니다.") };
  if (!NEXT_PAYMENT_STATUS[payment.status]?.includes(input.status)) {
    return { ok: false, error: { code: "CONFLICT", message: `${payment.status} 상태에서는 ${input.status}(으)로 변경할 수 없습니다.` } };
  }

  const timestampColumn = input.status === "processing" ? "processing_at" : input.status === "completed" ? "completed_at" : null;
  const { data, error } = await supabase.from("payments").update({
    status: input.status,
    ...(timestampColumn ? { [timestampColumn]: new Date().toISOString() } : {}),
    ...(input.externalReference?.trim() ? { tx_hash: input.externalReference.trim() } : {}),
    ...(input.status === "completed" ? { verified_by: authData.user.id, verified_at: new Date().toISOString() } : {}),
  }).eq("id", input.paymentId).eq("project_id", input.projectId).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: mapBackendError(error, "지급 상태를 변경하지 못했습니다.") };
  return { ok: true, data: { paymentId: data.id } };
}

export async function completeProject(projectId: string): Promise<BackendResult<{ projectId: string }>> {
  if (!isUuid(projectId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: project, error: projectError } = await supabase.from("projects").select("id, lifecycle_stage").eq("id", projectId).maybeSingle();
  if (projectError || !project) return { ok: false, error: mapBackendError(projectError, "프로젝트를 찾지 못했습니다.") };
  if (project.lifecycle_stage === "completed") return { ok: false, error: { code: "CONFLICT", message: "이미 완료된 프로젝트입니다." } };

  const { data: sow } = await supabase.from("sow_versions").select("id").eq("project_id", projectId).eq("status", "approved").maybeSingle();
  if (!sow) return { ok: false, error: { code: "CONFLICT", message: "승인된 SOW가 없어 완료 처리할 수 없습니다." } };

  const { data: milestones, error: milestoneError } = await supabase.from("milestones").select("id, status").eq("sow_version_id", sow.id);
  if (milestoneError) return { ok: false, error: mapBackendError(milestoneError, "마일스톤을 불러오지 못했습니다.") };
  if (!milestones?.length || milestones.some((milestone) => milestone.status !== "approved")) {
    return { ok: false, error: { code: "CONFLICT", message: "모든 마일스톤이 최종 승인되어야 완료 처리할 수 있습니다." } };
  }

  const milestoneIds = milestones.map((milestone) => milestone.id);
  const { data: payments, error: paymentsError } = await supabase.from("payments").select("milestone_record_id, status").eq("project_id", projectId).in("milestone_record_id", milestoneIds);
  if (paymentsError) return { ok: false, error: mapBackendError(paymentsError, "지급 기록을 불러오지 못했습니다.") };
  const completedPaymentMilestoneIds = new Set((payments ?? []).filter((payment) => payment.status === "completed").map((payment) => payment.milestone_record_id));
  if (!milestoneIds.every((id) => completedPaymentMilestoneIds.has(id))) {
    return { ok: false, error: { code: "CONFLICT", message: "모든 마일스톤의 지급이 완료되어야 프로젝트를 완료 처리할 수 있습니다." } };
  }

  const { data, error } = await supabase.from("projects").update({ lifecycle_stage: "completed" }).eq("id", projectId).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: mapBackendError(error, "프로젝트를 완료 처리하지 못했습니다.") };
  return { ok: true, data: { projectId: data.id } };
}

export async function generateEvidenceBundle(projectId: string): Promise<BackendResult<GenerateEvidenceBundleOutput>> {
  if (!isUuid(projectId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, title, company_id, current_requirement_version_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) return { ok: false, error: mapBackendError(projectError, "프로젝트를 찾지 못했습니다.") };

  const { data: requirementVersion } = await supabase
    .from("project_requirement_versions")
    .select("id, version_number, title, goal, requirements, deliverables, out_of_scope, budget_amount, budget_type, currency, start_date, end_date")
    .eq("id", project.current_requirement_version_id)
    .maybeSingle();

  const { data: selection } = await supabase.from("selections").select("proposal_id, selected_at").eq("project_id", projectId).maybeSingle();
  const proposal = selection
    ? (await supabase.from("proposals").select("id, freelancer_id, content, submitted_at").eq("id", selection.proposal_id).maybeSingle()).data
    : null;

  const { data: sowVersion } = await supabase
    .from("sow_versions")
    .select("id, version_number, content, content_hash, approved_at")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .maybeSingle();
  const sowApprovals = sowVersion
    ? (await supabase.from("sow_approvals").select("approver_role, approver_name_snapshot, approved_at, content_hash").eq("sow_version_id", sowVersion.id)).data
    : [];

  const milestones = sowVersion
    ? (await supabase.from("milestones").select("id, code, title, amount, currency, status, position").eq("sow_version_id", sowVersion.id).order("position")).data ?? []
    : [];
  const milestoneIds = milestones.map((milestone) => milestone.id);

  const [criteriaResult, submissionsResult, decisionsResult, invoicesResult, paymentsResult] = await Promise.all([
    milestoneIds.length ? supabase.from("completion_criteria").select("id, milestone_id, kind, description, verification_method, is_required, position").in("milestone_id", milestoneIds) : Promise.resolve({ data: [] }),
    milestoneIds.length ? supabase.from("milestone_submissions").select("id, milestone_id, attempt_number, pull_request_number, pull_request_url, head_branch, head_commit_sha, status, submitted_at").in("milestone_id", milestoneIds).order("attempt_number", { ascending: false }) : Promise.resolve({ data: [] }),
    milestoneIds.length ? supabase.from("milestone_decisions").select("milestone_id, decision, reason, decided_at").in("milestone_id", milestoneIds).order("decided_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("invoices").select("id, milestone_id, invoice_number, status, amount, currency, external_reference, submitted_at, reviewed_at").eq("project_id", projectId),
    supabase.from("payments").select("id, milestone_record_id, invoice_id, status, amount_usdc, currency, tx_hash, requested_at, processing_at, completed_at, verified_at").eq("project_id", projectId),
  ]);
  const submissionIds = (submissionsResult.data ?? []).map((submission) => submission.id);
  const verificationRunsResult = submissionIds.length
    ? await supabase.from("verification_runs").select("id, milestone_id, submission_id, status, attempt_number, completed_at, preview_url, error_summary").in("submission_id", submissionIds).order("attempt_number", { ascending: false })
    : { data: [] };
  const runIds = (verificationRunsResult.data ?? []).map((run) => run.id);
  const criterionResultsResult = runIds.length
    ? await supabase.from("criterion_results").select("run_id, criterion_id, status, observed_result, error_message, supporting_commit_sha").in("run_id", runIds)
    : { data: [] };

  const { data: latestBundle } = await supabase.from("evidence_bundles").select("version_number").eq("project_id", projectId).order("version_number", { ascending: false }).limit(1).maybeSingle();
  const versionNumber = (latestBundle?.version_number ?? 0) + 1;

  const payload = {
    project: { id: project.id, title: project.title },
    requirementVersion,
    selection: selection ? { selectedAt: selection.selected_at, proposal } : null,
    sow: sowVersion ? { ...sowVersion, approvals: sowApprovals } : null,
    milestones: milestones.map((milestone) => ({
      ...milestone,
      completionCriteria: (criteriaResult.data ?? []).filter((criterion) => criterion.milestone_id === milestone.id),
      submissions: (submissionsResult.data ?? []).filter((submission) => submission.milestone_id === milestone.id),
      verificationRuns: (verificationRunsResult.data ?? [])
        .filter((run) => run.milestone_id === milestone.id)
        .map((run) => ({ ...run, criterionResults: (criterionResultsResult.data ?? []).filter((result) => result.run_id === run.id) })),
      finalDecision: (decisionsResult.data ?? []).find((decision) => decision.milestone_id === milestone.id && decision.decision === "approved") ?? null,
    })),
    invoices: invoicesResult.data ?? [],
    payments: paymentsResult.data ?? [],
    generatedAt: new Date().toISOString(),
  };
  const sha256 = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  const { data: bundle, error: insertError } = await supabase.from("evidence_bundles").insert({
    project_id: projectId,
    version_number: versionNumber,
    status: "ready",
    sha256,
    payload,
    generated_by: authData.user.id,
    completed_at: new Date().toISOString(),
  }).select("id").single();
  if (insertError || !bundle) return { ok: false, error: mapBackendError(insertError, "통합 증빙 번들을 생성하지 못했습니다.") };
  return { ok: true, data: { bundleId: bundle.id, versionNumber } };
}

export async function getEvidenceBundleDetail(projectId: string, bundleId: string): Promise<BackendResult<EvidenceBundleDetail>> {
  if (!isUuid(projectId) || !isUuid(bundleId)) return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 번들이 아닙니다." } };
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: bundle, error } = await supabase
    .from("evidence_bundles")
    .select("id, version_number, status, sha256, requested_at, completed_at, error_message, payload")
    .eq("id", bundleId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error || !bundle) return { ok: false, error: mapBackendError(error, "통합 증빙 번들을 찾지 못했습니다.") };
  return {
    ok: true,
    data: {
      id: bundle.id,
      versionNumber: bundle.version_number,
      status: bundle.status,
      sha256: bundle.sha256,
      requestedAt: bundle.requested_at,
      completedAt: bundle.completed_at,
      errorMessage: bundle.error_message,
      payload: bundle.payload,
    },
  };
}

function firstBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Map<string, T> {
  const result = new Map<string, T>();
  for (const row of rows) if (!result.has(String(row[key]))) result.set(String(row[key]), row);
  return result;
}

async function toInvoice(row: {
  id: string; project_id: string; milestone_id: string; invoice_number: string; status: InvoiceRecord["status"];
  amount: number; currency: string; external_reference: string | null; submitted_at: string; reviewed_at: string | null; review_note: string | null;
}, projectTitle: string, organizationName: string, milestone?: { code: string; title: string }, translate = false): Promise<InvoiceRecord> {
  const milestoneTitle = milestone?.title
    ? (translate ? await translateToEnglish(milestone.title) : milestone.title)
    : (translate ? "Milestone" : "마일스톤");
  const reviewNote = translate && row.review_note
    ? await translateToEnglish(row.review_note)
    : row.review_note;

  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle,
    organizationName,
    milestoneId: row.milestone_id,
    milestoneCode: milestone?.code ?? "-",
    milestoneTitle,
    invoiceNumber: row.invoice_number,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    externalReference: row.external_reference,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewNote,
  };
}
