"use server";

import { revalidatePath } from "next/cache";
import type { BackendResult, CompanyProfileSettings, FreelancerProfileSettings } from "@/lib/backend";
import { updateCompanyProfileSettings, updateFreelancerProfileSettings } from "@/lib/backend";
import {
  buildDisplayFromPendingProfile,
  type CurrentUserDisplay,
  type PendingOnboardingProfile,
} from "@/lib/onboarding-storage";

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

export async function syncPendingOnboardingProfileAction(
  pending: PendingOnboardingProfile,
): Promise<BackendResult<CurrentUserDisplay>> {
  const result =
    pending.role === "company"
      ? await updateCompanyProfileSettings({
          organizationName: pending.data.organization_name,
          contactName: pending.data.contact_name,
          contactRole: pending.data.contact_role,
          teamSize: pending.data.team_size,
          website: pending.data.website ?? "",
        })
      : await updateFreelancerProfileSettings({
          displayName: pending.data.display_name,
          timezone: pending.data.timezone,
          headline: pending.data.headline,
          skills: pending.data.skills,
          portfolioUrls: pending.data.portfolio_urls,
          walletAddress: null,
        });

  if (!result.ok) return result;

  revalidatePath(pending.role === "company" ? "/company" : "/freelancer", "layout");
  return { ok: true, data: buildDisplayFromPendingProfile(pending) };
}
