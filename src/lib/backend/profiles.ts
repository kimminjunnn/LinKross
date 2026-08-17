import type { BackendResult, CompanyProfileSettings, FreelancerProfileSettings } from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCompanyProfileSettings(): Promise<BackendResult<CompanyProfileSettings>> {
  const auth = await getAuthenticatedClient();
  if (!auth.ok) return auth;
  const { data, error } = await auth.data.supabase.from("company_profiles").select("organization_name, contact_name, contact_role, team_size, website").eq("id", auth.data.userId).maybeSingle();
  if (error) return { ok: false, error: mapBackendError(error, "기업 프로필을 불러오지 못했습니다.") };
  return { ok: true, data: { organizationName: data?.organization_name ?? "", contactName: data?.contact_name ?? "", contactRole: data?.contact_role ?? "", teamSize: data?.team_size ?? "", website: data?.website ?? "" } };
}

export async function getFreelancerProfileSettings(): Promise<BackendResult<FreelancerProfileSettings>> {
  const auth = await getAuthenticatedClient();
  if (!auth.ok) return auth;
  const { data, error } = await auth.data.supabase.from("freelancer_profiles").select("display_name, timezone, headline, skills, portfolio_urls").eq("id", auth.data.userId).maybeSingle();
  if (error) return { ok: false, error: mapBackendError(error, "프로필을 불러오지 못했습니다.") };
  return { ok: true, data: { displayName: data?.display_name ?? "", timezone: data?.timezone ?? "", headline: data?.headline ?? "", skills: data?.skills ?? "", portfolioUrls: data?.portfolio_urls ?? [] } };
}

export async function updateCompanyProfileSettings(input: CompanyProfileSettings): Promise<BackendResult<CompanyProfileSettings>> {
  if (![input.organizationName, input.contactName, input.contactRole, input.teamSize].every((value) => value.trim())) return { ok: false, error: { code: "INVALID_INPUT", message: "기업명, 담당자, 역할, 팀 규모를 모두 입력해주세요." } };
  const auth = await getAuthenticatedClient();
  if (!auth.ok) return auth;
  const { error } = await auth.data.supabase.from("company_profiles").upsert({ id: auth.data.userId, organization_name: input.organizationName.trim(), contact_name: input.contactName.trim(), contact_role: input.contactRole.trim(), team_size: input.teamSize.trim(), website: input.website.trim() || null }, { onConflict: "id" });
  if (error) return { ok: false, error: mapBackendError(error, "기업 프로필을 저장하지 못했습니다.") };
  return { ok: true, data: { ...input, organizationName: input.organizationName.trim(), contactName: input.contactName.trim(), contactRole: input.contactRole.trim(), teamSize: input.teamSize.trim(), website: input.website.trim() } };
}

export async function updateFreelancerProfileSettings(input: FreelancerProfileSettings): Promise<BackendResult<FreelancerProfileSettings>> {
  if (![input.displayName, input.timezone, input.headline, input.skills].every((value) => value.trim())) return { ok: false, error: { code: "INVALID_INPUT", message: "Name, time zone, headline, and skills are required." } };
  const auth = await getAuthenticatedClient();
  if (!auth.ok) return auth;
  const portfolioUrls = input.portfolioUrls.map((url) => url.trim()).filter(Boolean);
  if (portfolioUrls.some((url) => !/^https?:\/\//i.test(url))) return { ok: false, error: { code: "INVALID_INPUT", message: "Portfolio links must start with http:// or https://." } };
  const { error } = await auth.data.supabase.from("freelancer_profiles").upsert({ id: auth.data.userId, display_name: input.displayName.trim(), timezone: input.timezone.trim(), headline: input.headline.trim(), skills: input.skills.trim(), portfolio_urls: portfolioUrls }, { onConflict: "id" });
  if (error) return { ok: false, error: mapBackendError(error, "Profile could not be saved.") };
  return { ok: true, data: { displayName: input.displayName.trim(), timezone: input.timezone.trim(), headline: input.headline.trim(), skills: input.skills.trim(), portfolioUrls } };
}

async function getAuthenticatedClient(): Promise<BackendResult<{ supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; userId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  return { ok: true, data: { supabase, userId: data.user.id } };
}
