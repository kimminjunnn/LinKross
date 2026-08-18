"use server";

import { revalidatePath } from "next/cache";

import type { BackendResult, ReviewInvoiceInput, SubmitInvoiceInput } from "@/lib/backend";
import { reviewInvoice, submitInvoice } from "@/lib/backend";

function revalidateFinance(projectId: string) {
  revalidatePath(`/company/projects/${projectId}/evidence`);
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
