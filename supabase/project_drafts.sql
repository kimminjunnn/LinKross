-- Supabase SQL Editor에서 실행 (mvp_domain_schema.sql / mvp_schema_fix_v2.sql 이후 아무 때나).
-- 프로젝트 등록 폼의 "임시 저장" 기능을 위한 테이블.
-- projects/project_requirement_versions와는 완전히 분리된 별도 테이블이다.
-- create_project_with_requirements RPC나 project_status enum은 건드리지 않는다 —
-- 초안은 아직 "프로젝트"가 아니므로 검증되지 않은 채로 자유롭게 저장·수정 가능해야 하고,
-- 실제 등록 시점에는 기존 RPC를 그대로 호출한다(등록 성공 후 이 테이블의 행은 삭제한다).

create table public.project_drafts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.profiles(id) on delete cascade,
  form_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (company_id)
);

alter table public.project_drafts enable row level security;

-- 본인 명의로만 생성 가능
create policy "project_drafts_insert_own" on public.project_drafts
  for insert to authenticated
  with check (auth.uid() = company_id);

-- 본인 초안만 조회 가능
create policy "project_drafts_select_own" on public.project_drafts
  for select to authenticated
  using (auth.uid() = company_id);

-- 본인 초안만 갱신 가능 (임시 저장을 반복 호출할 때마다 덮어씀 — 초안은 원문 불변 원칙 대상이 아님)
create policy "project_drafts_update_own" on public.project_drafts
  for update to authenticated
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

-- 본인 초안만 삭제 가능 (실제 등록 완료 시 앱 코드에서 삭제)
create policy "project_drafts_delete_own" on public.project_drafts
  for delete to authenticated
  using (auth.uid() = company_id);
