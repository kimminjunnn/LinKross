-- Supabase SQL Editor에서 실행.
-- 문제: freelancer_profiles row가 없는 계정이 proposals를 insert하면
--   prepare_proposal_insert 트리거가 snapshot 컬럼들을 전부 NULL로 세팅하고,
--   freelancer_portfolio_urls_snapshot의 NOT NULL 제약에서 원인이 불분명한 에러로 실패했다.
-- 조치: 프로필 row가 없으면 즉시 명확한 예외(FREELANCER_PROFILE_REQUIRED)를 던지도록 바꾼다.
--   앱 레벨(src/lib/backend/proposals.ts)에서도 같은 조건을 먼저 확인해서 막지만,
--   트리거 자체도 안전하게 막아야 다른 경로로 들어온 insert도 동일하게 보호된다.

create or replace function public.prepare_proposal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
begin
  select * into project_row
  from public.projects
  where id = new.project_id;

  if project_row.id is null then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  if new.freelancer_id <> (select auth.uid()) then
    raise exception 'FREELANCER_ID_MISMATCH';
  end if;

  if not private.has_role('freelancer'::public.user_role) then
    raise exception 'FREELANCER_ROLE_REQUIRED';
  end if;

  if project_row.status <> 'recruiting'::public.project_status
    or now() < project_row.recruitment_start_at
    or now() > project_row.recruitment_end_at then
    raise exception 'RECRUITMENT_NOT_OPEN';
  end if;

  if length(trim(new.content)) = 0 then
    raise exception 'PROPOSAL_CONTENT_REQUIRED';
  end if;

  new.requirement_version_id = project_row.current_requirement_version_id;
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
