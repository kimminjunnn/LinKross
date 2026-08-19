"use server";

import { revalidatePath } from "next/cache";

import type { AdvancePaymentStatusInput, BackendResult, GenerateEvidenceBundleOutput, RecordWalletPaymentInput, RequestPaymentInput, ReviewInvoiceInput, SubmitInvoiceInput } from "@/lib/backend";
import { advancePaymentStatus, completeProject, generateEvidenceBundle, recordWalletPayment, requestPayment, reviewInvoice, submitInvoice } from "@/lib/backend";

function revalidateFinance(projectId: string) {
  revalidatePath(`/company/projects/${projectId}`);
  revalidatePath(`/company/projects/${projectId}/evidence`);
  revalidatePath("/company/projects");
  revalidatePath(`/freelancer/projects/${projectId}`);
  revalidatePath(`/freelancer/projects/${projectId}/evidence`);
  revalidatePath("/freelancer/invoices");
}

export async function submitInvoiceAction(input: SubmitInvoiceInput): Promise<BackendResult<{ invoiceId: string }>> {
  const result = await submitInvoice(input);
  if (result.ok) revalidateFinance(input.projectId);
  return result;
}

export async function reviewInvoiceAction(input: ReviewInvoiceInput): Promise<BackendResult<{ invoiceId: string }>> {
  const result = await reviewInvoice(input);
  if (result.ok) revalidateFinance(input.projectId);
  return result;
}

export async function requestPaymentAction(input: RequestPaymentInput): Promise<BackendResult<{ paymentId: string }>> {
  const result = await requestPayment(input);
  if (result.ok) revalidateFinance(input.projectId);
  return result;
}

export async function advancePaymentStatusAction(input: AdvancePaymentStatusInput): Promise<BackendResult<{ paymentId: string }>> {
  const result = await advancePaymentStatus(input);
  if (result.ok) revalidateFinance(input.projectId);
  return result;
}

export async function recordWalletPaymentAction(input: RecordWalletPaymentInput): Promise<BackendResult<{ paymentId: string | null; verified: boolean; reason?: string }>> {
  const result = await recordWalletPayment(input);
  if (result.ok && result.data.verified) revalidateFinance(input.projectId);
  return result;
}

export async function generateEvidenceBundleAction(projectId: string): Promise<BackendResult<GenerateEvidenceBundleOutput>> {
  const result = await generateEvidenceBundle(projectId);
  if (result.ok) revalidateFinance(projectId);
  return result;
}

export async function completeProjectAction(projectId: string): Promise<BackendResult<{ projectId: string }>> {
  const result = await completeProject(projectId);
  if (result.ok) revalidateFinance(projectId);
  return result;
}
