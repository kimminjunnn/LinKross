export const ONBOARDING_PROFILE_STORAGE_KEY = "linkross_onboarding_profile";

export interface PendingCompanyProfile {
  role: "company";
  data: {
    organization_name: string;
    contact_name: string;
    contact_role: string;
    team_size: string;
    website: string | null;
  };
}

export interface PendingFreelancerProfile {
  role: "freelancer";
  data: {
    display_name: string;
    timezone: string;
    headline: string;
    skills: string;
    portfolio_urls: string[];
  };
}

export type PendingOnboardingProfile = PendingCompanyProfile | PendingFreelancerProfile;

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  founder: "대표 · 공동창업자",
  "product-owner": "Product Owner",
  operations: "운영 담당자",
  other: "기타",
};

export interface CurrentUserDisplay {
  name: string;
  roleLabel: string;
  initial: string;
}

export function buildDisplayFromPendingProfile(pending: PendingOnboardingProfile): CurrentUserDisplay {
  if (pending.role === "company") {
    return {
      name: pending.data.contact_name,
      roleLabel: CONTACT_ROLE_LABELS[pending.data.contact_role] ?? "기업 담당자",
      initial: pending.data.contact_name.charAt(0).toUpperCase(),
    };
  }

  return {
    name: pending.data.display_name,
    roleLabel: "프리랜서",
    initial: pending.data.display_name.charAt(0).toUpperCase(),
  };
}
