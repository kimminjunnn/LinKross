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
    portfolio_url: string | null;
  };
}

export type PendingOnboardingProfile = PendingCompanyProfile | PendingFreelancerProfile;
