"use server";

import { revalidatePath } from "next/cache";

import type { BackendResult, UpsertSubscriptionInput } from "@/lib/backend";
import { upsertCompanySubscription } from "@/lib/backend";

export async function upsertCompanySubscriptionAction(
  input: UpsertSubscriptionInput,
): Promise<BackendResult<{ subscriptionId: string }>> {
  const result = await upsertCompanySubscription(input);
  if (result.ok) revalidatePath("/company/settings");
  return result;
}
