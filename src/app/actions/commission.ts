"use server";

import { revalidatePath } from "next/cache";

import type { BackendResult, MarkCommissionChargePaidInput } from "@/lib/backend";
import { markCommissionChargePaid } from "@/lib/backend";

export async function markCommissionChargePaidAction(
  input: MarkCommissionChargePaidInput,
): Promise<BackendResult<{ chargeId: string }>> {
  const result = await markCommissionChargePaid(input);
  if (result.ok) {
    revalidatePath("/freelancer/commissions");
    revalidatePath("/freelancer");
  }
  return result;
}
