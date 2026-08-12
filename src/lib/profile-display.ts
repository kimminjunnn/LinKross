import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTACT_ROLE_LABELS, type CurrentUserDisplay } from "@/lib/onboarding-storage";

export type { CurrentUserDisplay };

export async function getCurrentUserDisplay(): Promise<CurrentUserDisplay | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role === "company") {
    const { data: companyProfile } = await supabase
      .from("company_profiles")
      .select("contact_name, contact_role")
      .eq("id", user.id)
      .maybeSingle();

    if (companyProfile?.contact_name) {
      return {
        name: companyProfile.contact_name,
        roleLabel: CONTACT_ROLE_LABELS[companyProfile.contact_role] ?? "기업 담당자",
        initial: companyProfile.contact_name.charAt(0).toUpperCase(),
      };
    }
  }

  if (profile?.role === "freelancer") {
    const { data: freelancerProfile } = await supabase
      .from("freelancer_profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (freelancerProfile?.display_name) {
      return {
        name: freelancerProfile.display_name,
        roleLabel: "프리랜서",
        initial: freelancerProfile.display_name.charAt(0).toUpperCase(),
      };
    }
  }

  // 온보딩 이전에 가입해 확장 프로필이 없는 계정은 이메일로 대체 표시한다.
  const fallbackName = user.email ?? "사용자";
  return {
    name: fallbackName,
    roleLabel: profile?.role === "freelancer" ? "프리랜서" : "기업 담당자",
    initial: fallbackName.charAt(0).toUpperCase(),
  };
}
