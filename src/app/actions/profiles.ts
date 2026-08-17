"use server";

import { revalidatePath } from "next/cache";
import type { BackendResult, CompanyProfileSettings, FreelancerProfileSettings } from "@/lib/backend";
import { updateCompanyProfileSettings, updateFreelancerProfileSettings } from "@/lib/backend";

export async function updateCompanyProfileAction(input: CompanyProfileSettings): Promise<BackendResult<CompanyProfileSettings>> {
  const result = await updateCompanyProfileSettings(input);
  if (result.ok) revalidatePath("/company", "layout");
  return result;
}

export async function updateFreelancerProfileAction(input: FreelancerProfileSettings): Promise<BackendResult<FreelancerProfileSettings>> {
  const result = await updateFreelancerProfileSettings(input);
  if (result.ok) revalidatePath("/freelancer", "layout");
  return result;
}
