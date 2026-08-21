"use server";

import { revalidatePath } from "next/cache";

import type { BackendResult, MarkCommissionChargePaidInput, VerifyCommissionWalletPaymentInput } from "@/lib/backend";
import { markCommissionChargePaid, verifyCommissionWalletPayment } from "@/lib/backend";

function revalidateCommissions() {
  revalidatePath("/freelancer/commissions");
  revalidatePath("/freelancer");
}

export async function markCommissionChargePaidAction(
  input: MarkCommissionChargePaidInput,
): Promise<BackendResult<{ chargeId: string }>> {
  const result = await markCommissionChargePaid(input);
  if (result.ok) revalidateCommissions();
  return result;
}

export async function verifyCommissionWalletPaymentAction(
  input: VerifyCommissionWalletPaymentInput,
): Promise<BackendResult<{ chargeId: string; verified: boolean; reason?: string }>> {
  const result = await verifyCommissionWalletPayment(input);
  if (result.ok && result.data.verified) revalidateCommissions();
  return result;
}
