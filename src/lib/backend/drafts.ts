import type { BackendResult, ProjectDraftFormData } from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProjectDraft(): Promise<BackendResult<ProjectDraftFormData | null>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data, error } = await supabase
    .from("project_drafts")
    .select("form_data")
    .eq("company_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: mapBackendError(error, "임시 저장된 내용을 불러오지 못했습니다.") };
  }

  return { ok: true, data: (data?.form_data as ProjectDraftFormData | undefined) ?? null };
}

export async function saveProjectDraft(
  formData: ProjectDraftFormData,
): Promise<BackendResult<{ updatedAt: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data, error } = await supabase
    .from("project_drafts")
    .upsert(
      { company_id: authData.user.id, form_data: formData, updated_at: new Date().toISOString() },
      { onConflict: "company_id" },
    )
    .select("updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: mapBackendError(error, "임시 저장에 실패했습니다.") };
  }

  return { ok: true, data: { updatedAt: data.updated_at as string } };
}

export async function deleteProjectDraft(): Promise<BackendResult<null>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { error } = await supabase.from("project_drafts").delete().eq("company_id", authData.user.id);

  if (error) {
    return { ok: false, error: mapBackendError(error, "임시 저장 내용을 정리하지 못했습니다.") };
  }

  return { ok: true, data: null };
}
