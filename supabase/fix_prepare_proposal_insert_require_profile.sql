-- Supabase SQL Editor에서 실행.
-- 문제: freelancer_profiles row가 없는 계정이 proposals를 insert하면
--   prepare_proposal_insert 트리거가 snapshot 컬럼들을 전부 NULL로 세팅하고,
--   freelancer_portfolio_urls_snapshot의 NOT NULL 제약에서 원인이 불분명한 에러로 실패했다.
-- 조치: 프로필 row가 없으면 즉시 명확한 예외(FREELANCER_PROFILE_REQUIRED)를 던지도록 바꾼다.
--   앱 레벨(src/lib/backend/proposals.ts)에서도 같은 조건을 먼저 확인해서 막지만,
--   트리거 자체도 안전하게 막아야 다른 경로로 들어온 insert도 동일하게 보호된다.
--
-- 주의(이 파일을 처음 실행한 뒤 발견된 버그의 수정본):
--   mvp_domain_schema.sql에 있던 예전 함수 본문을 그대로 가져다 썼더니, 이미
--   mvp_schema_fix_v2.sql에서 projects 테이블의 recruitment_start_at/recruitment_end_at
--   컬럼을 project_requirement_versions로 옮기고 트리거도 그에 맞게 고쳐놓은 걸 다시
--   옛날 버전으로 덮어써버렸다. 그 결과 모든 제안서 제출이
--   `record "project_row" has no field "recruitment_start_at"` 에러로 실패했다.
--   아래는 mvp_schema_fix_v2.sql의 최신 로직을 기준으로 다시 작성한 버전이다.
--   이 파일을 이미 실행했다면, 반드시 이 수정본을 다시 실행해야 한다.

create or replace function public.prepare_proposal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_status_value public.project_status;
  requirement_version_id_value uuid;
  recruitment_start_value timestamptz;
  recruitment_end_value timestamptz;
begin
  select
    p.status,
    p.current_requirement_version_id,
    rv.recruitment_start_at,
    rv.recruitment_end_at
  into
    project_status_value,
    requirement_version_id_value,
    recruitment_start_value,
    recruitment_end_value
  from public.projects p
  join public.project_requirement_versions rv
    on rv.id = p.current_requirement_version_id
   and rv.project_id = p.id
  where p.id = new.project_id;

  if requirement_version_id_value is null then
    raise exception 'PROJECT_OR_CURRENT_REQUIREMENT_VERSION_NOT_FOUND';
  end if;

  if new.freelancer_id <> (select auth.uid()) then
    raise exception 'FREELANCER_ID_MISMATCH';
  end if;

  if not private.has_role('freelancer'::public.user_role) then
    raise exception 'FREELANCER_ROLE_REQUIRED';
  end if;

  if project_status_value <> 'recruiting'::public.project_status
    or now() < recruitment_start_value
    or now() > recruitment_end_value then
    raise exception 'RECRUITMENT_NOT_OPEN';
  end if;

  if length(trim(new.content)) = 0 then
    raise exception 'PROPOSAL_CONTENT_REQUIRED';
  end if;

  new.requirement_version_id = requirement_version_id_value;
  new.status = 'submitted'::public.proposal_status;
  new.submitted_at = coalesce(new.submitted_at, now());

  select
    fp.display_name,
    fp.headline,
    fp.skills,
    fp.portfolio_urls
  into
    new.freelancer_display_name_snapshot,
    new.freelancer_headline_snapshot,
    new.freelancer_skills_snapshot,
    new.freelancer_portfolio_urls_snapshot
  from public.freelancer_profiles fp
  where fp.id = new.freelancer_id;

  if not found then
    raise exception 'FREELANCER_PROFILE_REQUIRED';
  end if;

  return new;
end;
$$;
